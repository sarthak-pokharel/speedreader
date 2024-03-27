import json
from unstructured.partition.auto import partition
import unstructured
import pickle
import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.output_parsers import OutputFixingParser

from langchain_core.pydantic_v1 import BaseModel, Field, validator
from langchain.output_parsers import PydanticOutputParser
from typing import List

import uuid

import dotenv
dotenv.load_dotenv()


def genHash():
    return uuid.uuid4().hex




def load_pdf_name(hash_id):
    resources = json.load(open('./resources/res.json'))
    pdfname = list(filter(lambda x:x['hash'] == hash_id,resources))[0]['filename']
    return "./resources/"+pdfname
def load_pdf(hash, cache=True):
    pklfn = './resources/'+hash+".pkl"
    if os.path.isfile(pklfn) and cache:
        pages = pickle.load(open(pklfn, 'rb'))
        return pages
    print("cache doesnt exist")
    fname = load_pdf_name(hash)
    elements = partition(fname)
    pages = list(range(elements[-1].metadata.page_number))

    for el in elements:
        if type(pages[el.metadata.page_number-1]) == int:
            pages[el.metadata.page_number-1] = []
        if type(el)==unstructured.documents.elements.Footer:
            continue
        if type(el)==unstructured.documents.elements.Header:
            continue
        pages[el.metadata.page_number-1].append(el)
    pickle.dump(pages,open(pklfn, 'wb'))
    return pages
def prep_documents_set(pdf_pages):
    docs = []
    for p in pdf_pages:
        str = ""
        # print(type(p))
        for el in p:
            str += el.text+"\n\n"
        docs.append(str)
    return docs

def docs_overlap(_docs):
    docs = _docs.copy()
    maxl = len(docs)
    splitter_char = ". "
    overlap_num_sentences = 1
    prechunk_wrapper = lambda x: f"<div class='prechunk' info='content from previous page'>{x}</div>"
    pstchunk_wrapper = lambda x: f"<div class='pstchunk info='content from next page'>{x}</div>"
    for i, doc in enumerate(docs):
        if i<1:
            continue
        prechunk = _docs[i-1].split(splitter_char)[-overlap_num_sentences:]
        prechunk = splitter_char.join(prechunk)
        prechunk = prechunk_wrapper(prechunk)
        docs[i] = prechunk + docs[i]
        if i>=maxl-1:
            continue
        pstchunk = _docs[i+1].split(splitter_char)[:overlap_num_sentences]
        pstchunk = splitter_char.join(pstchunk)
        pstchunk = pstchunk_wrapper(pstchunk)
        docs[i] = docs[i] + pstchunk
    return docs
    


def load_book(hash_value):
    # Perform any desired operations with the hash_value
    book_name = load_pdf_name(hash_value)
    pages = load_pdf(hash_value)
    docs = prep_documents_set(pages)
    overlapped = docs_overlap(docs)

    return [book_name,overlapped]


def register_book(fname):
    book_hash = genHash()
    resources = json.load(open('./resources/res.json'))
    resources.append(dict(filename=fname, hash=book_hash))
    open('./resources/res.json', 'w').write(json.dumps(resources))
    return book_hash



model = ChatOpenAI(temperature=0)

class PageSummary(BaseModel):
    summary:List[str] = Field(description="Summary of given page content as a list of string, make each summary descriptive and precise")
    precontext: str = Field(description="General Summary of the the book to use as context to provide summary for future pages. Its value is basically half the weight of summary of previous precontext added with the short summary of this page, but its not too long, since its just a summary to provide context. And if the precontext is non existent, just summarize the summary of current page's summary")
    pass
parser = PydanticOutputParser(pydantic_object=PageSummary)
new_parser = OutputFixingParser.from_llm(parser=parser, llm=model)

precontext_template = PromptTemplate(
    template="""You're a content summarizer bot. From a book/pdf, Summarize the following one page content in bullet points: 
    
    ```content
    
    {content}

    ```

    The context of the pdf till now is following, just to have an idea of what above content might mean:
    ```content

    {precontext}

    ```

    Output Format Instruction:
    {format_instructions}


    make sure your response is in given format.
    
    """,
    input_variables=["content", "precontext"],
    partial_variables={"format_instructions": parser.get_format_instructions()}
)


template = PromptTemplate(
    template="""You're a content summarizer bot. From a book/pdf, Summarize the following one page content in bullet points: 
    
    ```content
    
    {content}

    ```
    Output Format Instruction:
    {format_instructions}
    

    make sure your response is in given format.

    """,
    input_variables=["content"],
    partial_variables={"format_instructions": parser.get_format_instructions()}
)



default_summarize_chain = template | model | new_parser

precontext_summarize_chain = precontext_template | model | new_parser


def summarize(txt, gen_summary=""):
    if gen_summary == "":
        print("no presummary")
        outp = default_summarize_chain.invoke({"content":txt})
        return dict(summary=outp.summary, precontext=outp.precontext)
    print("yes presummary")
    outp = precontext_summarize_chain.invoke({"content":txt, "precontext":gen_summary})
    return dict(summary=outp.summary, precontext=outp.precontext)



import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button, CircularProgress, IconButton, List, ListItem, Typography } from '@mui/material'
import axios from 'axios'
import { ChevronLeft, ChevronRight, HourglassTop, RecyclingRounded, RestartAlt, Sync } from '@mui/icons-material'




async function fetchBook(hash) {
    let server_url = "http://127.0.0.1:5000/load_book";
    let res = await axios.post(server_url, { hash });
    return res.data;
}

function BookReader({ bookBreadth, bookname, pages, pageIndex, setPageIndex, triggerResetPageSummary }) {
    let changPageIndx = (k) => {
        // triggerResetPageSummary(Math.random())
        setPageIndex(v => v + k)
    };
    let setPageIndx = (k)=>{
        setPageIndex(k);
    }


    let bookpagesLen = pages.length;
    return <>
        <div style={{ height: '100%', width: (bookBreadth)+'%' }} className='basic-border'>
            <div className='mauto90'>
                <Typography variant='h6' className='frame-title'>{bookname}</Typography>
            </div>

            <div style={{ width: "90%", height: '90%', margin: 'auto', whiteSpace: 'pre-line', overflowY: 'auto' }} className='basic-border'>
                <Typography sx={{ padding: 2, fontSize: "0.8em" }} dangerouslySetInnerHTML={{ __html: pages[pageIndex] }}>
                </Typography>
            </div>
            <div style={{ width: "90%", margin: 'auto', display: 'flex', justifyContent: 'center', gap: 20 }}>
                <IconButton disabled={pageIndex == 0} onClick={() => changPageIndx(-1)}><ChevronLeft /></IconButton>
                <IconButton onClick={()=>{
                    let userInp = Math.round(Number(prompt("Enter Page Num to Navigate to")));
                    setPageIndex(userInp-1);
                }} size='small'>{pageIndex+1}</IconButton>
                <IconButton disabled={bookpagesLen == pageIndex} onClick={() => changPageIndx(1)}><ChevronRight /></IconButton>
            </div>
        </div>
    </>
}

function GeneralSummary({ precontext }) {
    return <>
        <div style={{ height: '30%' }} className='basic-border'>
            <div className='mauto90'>
                <Typography variant='h6' className='frame-title'>General Summary</Typography>
            </div>
            <div className='mauto90' style={{ whiteSpace: 'pre-line' }}>
                {precontext}
            </div>
        </div>
    </>
}


let loadStatusIcons = {
    'loading': <HourglassTop />,
    'loaded': <Sync />
}
function PageSummary({ pageSummary, triggerResetPageSummary, summaryLoadStatus, setSummaryLoadStatus }) {
    let isLoading = summaryLoadStatus == 'loading';
    return <>
        <div style={{ height: '70%', overflowY: 'auto' }} className='basic-border'>
            <div className='mauto90'>
                <Typography variant='h6'><span className='frame-title'>Page Summary</span>
                    &nbsp;&nbsp;&nbsp;
                    <IconButton
                        sx={{
                            width: 35, height: 35,
                            border: '1px solid',
                            borderColor: isLoading ? "#777" : "#2196f3",
                            color: isLoading ? "#777" : "#2196f3",
                        }}
                        onClick={() => triggerResetPageSummary(Math.random())}
                        disabled={summaryLoadStatus == 'loading'}
                    >
                        {loadStatusIcons[summaryLoadStatus]}
                    </IconButton>
                </Typography>
            </div>
            <div className='mauto90' style={{ whiteSpace: 'pre-line' }}>
                <List sx={{ listStyleType: 'lower-roman' }}>
                    {pageSummary.map((v, i) => <ListItem sx={{ display: 'list-item' }} key={i}>{v}</ListItem>)}
                </List>
            </div>
        </div>
    </>
}


let pageIndexCache = {};

function Book() {

    let [bookBreadth, setBookBreadth] = useState(60); // percentage

    let [bookName, setBookName] = useState("Book (Loading...)");
    let [bookData, setBookData] = useState([]);
    let [currentPageIndex, setCurrentPageIndex] = useState(0);

    let [precontext, setPrecontext] = useState("");

    let [pageSummary, setPageSummary] = useState([]);
    let [resetPageSummary, triggerResetPageSummary] = useState(0);

    let [summaryLoadStatus, setSummaryLoadStatus] = useState('loaded')

    let loadSummaryForPage = async id => {

        if (!bookData[id]) return [[],""];
        if (id in pageIndexCache) {
            if (pageIndexCache[id].constructor.name == "Promise"){
                return await pageIndexCache[id];
            }
            return [pageIndexCache[id], precontext]
        }

        
        let sum = await axios.post('http://127.0.0.1:5000/summarize_text', { content: bookData[id], precontext });
        pageIndexCache[id] = sum.data.result.summary;
        return [sum.data.result.summary, sum.data.result.precontext];
        
    }

    useEffect(() => {
        (async function () {
            let book_inf = await fetchBook("857irwueifdkjwo9eruj2iroeakdfm");
            setBookName(book_inf.result.bookname);
            setBookData(book_inf.result.pages);
            document.title = book_inf.result.bookname;
        })()
    }, []);

    useEffect(() => {

        (async function () {
            setSummaryLoadStatus('loading');
            setPageSummary([]);
            let [summary, precontext] = await loadSummaryForPage(currentPageIndex);
            setPageSummary(summary);
            setPrecontext(precontext);
            setSummaryLoadStatus('loaded');

            if (currentPageIndex > 0) {
                let prm = loadSummaryForPage(currentPageIndex - 1);
                pageIndexCache[currentPageIndex-1] = prm;
                await prm;
            }
            if (currentPageIndex < bookData.length) {
                let prm = loadSummaryForPage(currentPageIndex + 1);
                pageIndexCache[currentPageIndex+1] = prm;
                await prm;
            }
        })()
    }, [resetPageSummary,currentPageIndex])

    return (
        <>
            <div className='App' style={{ display: 'flex', height: '100%' }}>
                <BookReader bookBreadth={bookBreadth} bookname={bookName} pages={bookData} pageIndex={currentPageIndex} setPageIndex={setCurrentPageIndex} triggerResetPageSummary={triggerResetPageSummary} />
                <div style={{ display: 'flex', width: (100-bookBreadth)+'%', flexDirection: 'column' }}>
                    <PageSummary
                        pageSummary={pageSummary}
                        triggerResetPageSummary={triggerResetPageSummary}
                        summaryLoadStatus={summaryLoadStatus}
                        setSummaryLoadStatus={setSummaryLoadStatus}
                    />
                    <GeneralSummary precontext={precontext} />
                </div>
            </div>
        </>
    )
}

export default Book

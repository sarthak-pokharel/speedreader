import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button, CircularProgress, IconButton, List, ListItem, Typography } from '@mui/material'
import axios from 'axios'
import { ChevronLeft, ChevronRight, HourglassTop, RecyclingRounded, RestartAlt, Sync } from '@mui/icons-material'
import { useParams } from 'react-router-dom'




async function fetchBook(hash) {
    let server_url = "http://127.0.0.1:5000/load_book";
    let res = await axios.post(server_url, { hash });
    return res.data;
}

function BookReader({ bookBreadth, bookname, pages, pageIndex, setPageIndex, triggerResetPageSummary }) {
    let summaryMaker = function () {
        triggerResetPageSummary(Math.random())
    };
    let changPageIndx = (k) => {
        setPageIndex(v => v + k)
    };
    let setPageIndx = (k) => {
        setPageIndex(k);
    }


    let bookpagesLen = pages.length;
    return <>
        <div style={{ height: '100%', width: (bookBreadth) + '%' }} className='basic-border'>
            <div className='mauto90'>
                <Typography variant='h6' >
                    <IconButton onClick={() => {
                        let userInp = Math.round(Number(prompt("Enter Page Num to Navigate to")));
                        setPageIndex(userInp - 1);
                    }} size='small'>{pageIndex + 1} / {bookpagesLen}</IconButton>
                    &nbsp;&nbsp;&nbsp;
                    <span className='frame-title'>{bookname}</span>
                </Typography>
            </div>

            <div style={{ width: "90%", height: '90%', margin: 'auto', whiteSpace: 'pre-line', overflowY: 'auto' }} className='basic-border'>
                <Typography sx={{ padding: 2, fontSize: "0.8em" }} dangerouslySetInnerHTML={{ __html: pages[pageIndex] }}>
                </Typography>
            </div>
            <div style={{ width: "90%", margin: 'auto', display: 'flex', justifyContent: 'center', }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, width: "55%" }}>
                    <IconButton disabled={pageIndex == 0} onClick={() => changPageIndx(-1)}><ChevronLeft /></IconButton>
                    <IconButton disabled={bookpagesLen == pageIndex} onClick={() => changPageIndx(1)}><ChevronRight /></IconButton>
                </div>
                <div style={{ width: '45%', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant='outlined' onClick={summaryMaker}>SUMMARIZE</Button>
                </div>
            </div>
        </div>
    </>
}

function GeneralSummary({ precontext }) {
    return <>
        <div style={{ height: '30%', overflowY: 'auto' }} className='basic-border'>
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




function Book(props, v) {
    let { bookid } = useParams();

    let [bookBreadth, setBookBreadth] = useState(60); // percentage
    let [pageIndexCache, setPageIndexCache] = useState({});

    let [bookName, setBookName] = useState("Book (Loading...)");
    let [bookData, setBookData] = useState([]);
    let [currentPageIndex, setCurrentPageIndex] = useState(0);

    let [precontext, setPrecontext] = useState("");

    let [pageSummary, setPageSummary] = useState([]);


    let [summaryLoadStatus, setSummaryLoadStatus] = useState('loaded')

    let loadSummaryForPage = async id => {
        

        let sum = await axios.post('http://127.0.0.1:5000/summarize_text', { content: bookData[id], precontext });
        pageIndexCache[id] = [sum.data.result.summary];
        setPageIndexCache({...pageIndexCache});
        return [sum.data.result.summary, sum.data.result.precontext];

    }

    useEffect(() => {
        (async function () {

            let book_inf = await fetchBook(bookid);
            setBookName(book_inf.result.bookname);
            setBookData(book_inf.result.pages);
            document.title = book_inf.result.bookname;
        })()
    }, []);

    let triggerResetPageSummary = async function () {
        setSummaryLoadStatus('loading');
        setPageSummary([]);
        console.log('loading');
        let prom = loadSummaryForPage(currentPageIndex);
        pageIndexCache[currentPageIndex] = prom;
        setPageIndexCache({...pageIndexCache})
        let [exp, precontext]= await prom;

        // setPageSummary(summary);
        setPrecontext(precontext);
        setSummaryLoadStatus('loaded');
    };

    useEffect(() => {
        (async function () {
            setPageSummary([]);
            setSummaryLoadStatus('loading');
            if (currentPageIndex in pageIndexCache) {
                if (pageIndexCache[currentPageIndex].constructor.name == "Promise") {
                    let resp = await pageIndexCache[currentPageIndex];
                    setPageSummary(resp[0]);
                    setSummaryLoadStatus('loaded')
                    return;
                }
                setPageSummary(pageIndexCache[currentPageIndex][0]);
                setSummaryLoadStatus('loaded');
            } else {
                console.log('nopage');
                setSummaryLoadStatus('loaded');
            }
        })();
    }, [currentPageIndex]);

    useEffect(()=>{
        let cpi = currentPageIndex;
        (async function(){
            if (cpi in pageIndexCache) {
                setSummaryLoadStatus('loading');
                setPageSummary([]);
                if (pageIndexCache[cpi].constructor.name == "Promise") {
                    let resp = await pageIndexCache[cpi];
                    setPageSummary(resp[0]);
                    setSummaryLoadStatus('loaded')
                    return;
                }
                setPageSummary(pageIndexCache[cpi][0]);
                setSummaryLoadStatus('loaded');
            }else {
                setPageSummary([]);
                setSummaryLoadStatus("loaded");
            }
        })();
    }, [pageIndexCache]);

    return (
        <>
            <div className='App' style={{ display: 'flex', height: '100%' }}>
                <BookReader bookBreadth={bookBreadth} bookname={bookName} pages={bookData} pageIndex={currentPageIndex} setPageIndex={setCurrentPageIndex} triggerResetPageSummary={triggerResetPageSummary} />
                <div style={{ display: 'flex', width: (100 - bookBreadth) + '%', flexDirection: 'column' }}>
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

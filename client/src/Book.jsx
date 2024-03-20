import React, { Fragment, useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button, CircularProgress, Divider, IconButton, List, ListItem, Typography } from '@mui/material'
import axios from 'axios'
import { ChevronLeft, ChevronRight, HourglassTop, RecyclingRounded, RestartAlt, Sync } from '@mui/icons-material'
import { useParams } from 'react-router-dom'




async function fetchBook(hash) {
    let server_url = "http://127.0.0.1:5000/load_book";
    let res = await axios.post(server_url, { hash });
    return res.data;
}

function BookReader({ bookBreadth, bookname, pages, pageIndex, setPageIndex, triggerResetPageSummary,summaryLoadStatus }) {
    let summaryMaker = function () {
        triggerResetPageSummary(pageIndex)
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
                    <Button disabled={summaryLoadStatus=="loading"} variant='outlined' onClick={summaryMaker}>SUMMARIZE</Button>
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
function PageSummary({ pageSummary, triggerResetPageSummary, summaryLoadStatus,pageIndex, setSummaryLoadStatus }) {
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
                        onClick={() => triggerResetPageSummary(pageIndex)}
                        disabled={summaryLoadStatus == 'loading'}
                    >
                        {loadStatusIcons[summaryLoadStatus]}
                    </IconButton>
                </Typography>
            </div>
            <div className='mauto90' style={{ whiteSpace: 'pre-line' }}>
                <List>
                    {pageSummary
                        .map((v, i) => <Fragment key={i}>
                        <ListItem sx={{ 
                            cursor:'default',
                            marginTop: 1,
                            marginBottom: 1,
                            "&:hover":{
                                background: '#0001'
                            },
                            display: 'list-item'
                         }} key={i}>{v}</ListItem>
                        {i!=pageSummary.length-1?<Divider />:""}
                        </Fragment>)
                        }
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
        

        try {
            let sum = await axios.post('http://127.0.0.1:5000/summarize_text', { content: bookData[id], precontext });
        // pageIndexCache[id] = [sum.data.result.summary];
        // setPageIndexCache({...pageIndexCache});
        return [sum.data.result.summary, sum.data.result.precontext];
        }catch(err){
            return [["Couldn't load summary, Server Error"], precontext];
        }

    }

    useEffect(() => {
        (async function () {

            let book_inf = await fetchBook(bookid);
            setBookName(book_inf.result.bookname);
            setBookData(book_inf.result.pages);
            document.title = book_inf.result.bookname;
        })()
    }, []);

    let triggerResetPageSummary = async function (pid) {
        console.log('loading');
        let prom = loadSummaryForPage(pid);
        pageIndexCache[pid] = prom;
        setPageIndexCache({...pageIndexCache})
        let [exp, precontext]= await prom;

        // setPageSummary(summary);
        setPrecontext(precontext);
        // setSummaryLoadStatus('loaded');
    };

    useEffect(() => {
        let cpi = currentPageIndex;
        (async function (cpi) {
            setPageSummary([]);
            setSummaryLoadStatus('loading');
            if (cpi in pageIndexCache) {
                if (pageIndexCache[cpi].constructor.name == "Promise") {
                    let resp = await pageIndexCache[cpi];
                    setPageSummary(resp[0]);
                    setSummaryLoadStatus('loaded')
                    return;
                }
                setPageSummary(pageIndexCache[cpi][0]);
                setSummaryLoadStatus('loaded');
                return;
            }
            console.log('nopage', cpi, pageIndexCache[cpi]);
            setSummaryLoadStatus('loaded');
        })(cpi);
    }, [currentPageIndex]);

    useEffect(()=>{
        let cpi = currentPageIndex;
        (async function(cpi){
            setSummaryLoadStatus('loading');
            setPageSummary([]);
            if (cpi in pageIndexCache) {
                if (pageIndexCache[cpi].constructor.name == "Promise") {
                    let resp = await pageIndexCache[cpi];
                    pageIndexCache[cpi] = resp;
                    setPageIndexCache({...pageIndexCache});
                    // setPageSummary(resp[0]);
                    // console.log('hrer')
                    // setSummaryLoadStatus('loaded')
                    return;
                }
                setPageSummary(pageIndexCache[cpi][0]);
                setSummaryLoadStatus('loaded');
                return;
            }
            setPageSummary([]);
            setSummaryLoadStatus("loaded");
        })(cpi);
    }, [pageIndexCache]);

    return (
        <>
            <div className='App' style={{ display: 'flex', height: '100%' }}>
                <BookReader summaryLoadStatus={summaryLoadStatus} bookBreadth={bookBreadth} bookname={bookName} pages={bookData} pageIndex={currentPageIndex} setPageIndex={setCurrentPageIndex} triggerResetPageSummary={triggerResetPageSummary} />
                <div style={{ display: 'flex', width: (100 - bookBreadth) + '%', flexDirection: 'column' }}>
                    <PageSummary
                        pageIndex={currentPageIndex}
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

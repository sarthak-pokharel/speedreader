import React, { useState } from 'react';
import axios from 'axios';
import { Button, Divider, List, ListItem, ListItemButton, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

const FileUpload = () => {
    const [file, setFile] = useState(null);
    let navigateTo = useNavigate();
    let [status, setStatus] = useState("Upload File To Continue...");

    let [existingFiles, setExistingFiles] = useState([]);


    useState(function () {
        (async function () {
            let resp = (await axios.get("http://127.0.0.1:5000/existing_uploads")).data;
            console.log(resp)
            setExistingFiles(resp.books);
        })();
    }, []);

    const handleFileChange = async (event) => {
        let qfile = event.target.files[0];
        setStatus("Uploading ...")
        await handleUpload(qfile);
        setStatus("Uploaded ...")
    };

    const handleUpload = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post('http://127.0.0.1:5000/upload_doc', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            let _hash = response.data.hash;
            console.log('hash', _hash);
            window.location.href = "/Book/" + _hash;
        } catch (error) {
            console.error(error);
        }
    };

    return (<>
        <div style={{ width: '100%', height: '100%', background: '#f1f2f3' }}>
            <br />
            <br />
            <br />
            <div style={{ width: "70%", maxWidth:500, padding: "4%", margin: 'auto', background: '#fff', textAlign: 'center' }}>
                <div>
                    <Button variant="contained" component="label">
                        Upload File
                        <input type="file" onChange={handleFileChange} hidden />
                    </Button>
                </div>
                <br/>
                <div>
                    {status}
                </div>
                <br />
                <Divider />
                <br />
                <div>
                    <Typography variant='h5'>Archives ({existingFiles.length})</Typography>
                    <List>
                        {existingFiles.map((book, i) => {
                            return <ListItem key={book.hash}>
                                <ListItemButton onClick={v=>navigateTo("/Book/"+book.hash)}>
                                    {book.filename}
                                </ListItemButton>
                            </ListItem>
                        })}

                    </List>
                </div>
            </div>
        </div>
    </>
    );
};

export default FileUpload;
import React, { useState,useRef  } from 'react';
import { Document, Page, pdfjs } from "react-pdf";
import {Button, Drawer, message, Modal, Space} from "antd";
import {getPrdPagesApi} from '@/apis/prds';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
).toString();
const PdfPreview = ({url, open, onClose}) => {
    const [numPages, setNumPages] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showText, setShowText] = useState(false);
    const [prdText, setPrdText] = useState([]);

    const onDocumentLoadSuccess = async ({ numPages }) => {
        setNumPages(numPages);
        const res:any = await getPrdPagesApi({url: url, file_type: 'pdf'});
        if (res.success){
            console.log(res.data);
            setPrdText(res.data);
        }
    };

    return (
        <Drawer
            width={1000}
            open={open}
            onClose={onClose}
            footer={(
                <Space>
                    <Button
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        上一页
                    </Button>
                    <span>{currentPage} / {numPages}</span>
                    <Button
                        disabled={currentPage >= numPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        下一页
                    </Button>
                    <Button onClick={()=>setShowText(!showText)}>
                        显示{showText ? '原文': '文本'}
                    </Button>

                </Space>
            )}
        >
            <div hidden={!showText}>
                {prdText[currentPage - 1]}
            </div>
            <div hidden={showText}>
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                >
                    <Page width={900} pageNumber={currentPage} />
                </Document>
            </div>
        </Drawer>

    );
};

export default PdfPreview;
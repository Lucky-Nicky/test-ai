import React, {useState, useRef, useEffect} from 'react';
import {ZoomOutOutlined, ZoomInOutlined, LeftOutlined, RightOutlined,
    DoubleRightOutlined, DoubleLeftOutlined} from '@ant-design/icons';
import { Document, Page, pdfjs } from "react-pdf";
import {Button, Divider, Drawer, message, Modal, Space} from "antd";
import {getPrdPagesApi} from '@/apis/prds';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
).toString();
const PdfPreview = ({url, open, onClose, onGenCase, onAsk}) => {
    const [numPages, setNumPages] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showText, setShowText] = useState(false);
    const [prdText, setPrdText] = useState([]);
    const [pdfWidth, setPdfWidth] = useState(1000);

    const onDocumentLoadSuccess = async ({ numPages }) => {
        setNumPages(numPages);
        const res:any = await getPrdPagesApi({url: url, file_type: 'pdf'});
        if (res.success){
            console.log(res.data);
            setPrdText(res.data);
        }
    };
    const handleGenerateCase = () => {
        // const selection = window.getSelection();
        // if(!selection.toString()){
        //     message.info('请选中你要生成用例的文本');
        //     return
        // }
        onGenCase();
    };
    useEffect(()=>{
        setCurrentPage(1);
    }, [url])
    return (
        <Drawer
            width={'80%'}
            open={open}
            onClose={onClose}
            footer={(
                <Space>
                    <ZoomOutOutlined
                        style={{fontSize:20}}
                        onClick={()=>{
                            pdfWidth > 500 && setPdfWidth(pdfWidth - 100);
                        }}
                    />
                    <ZoomInOutlined
                        style={{fontSize:20}}
                        onClick={()=> {
                            pdfWidth < 2000 && setPdfWidth(pdfWidth + 100);
                        }}
                    />
                    <Button
                        size={"small"}
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage(1)}
                        icon={<DoubleLeftOutlined />}
                        type={"link"}
                    />
                    <Button
                        size={"small"}
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        icon={<LeftOutlined />}
                        type={"link"}
                    />
                    <span>{currentPage} / {numPages}</span>
                    <Button
                        size={"small"}
                        disabled={currentPage >= numPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        icon={<RightOutlined />}
                        type={"link"}
                    />
                    <Button
                        size={"small"}
                        disabled={currentPage >= numPages}
                        onClick={() => setCurrentPage(numPages)}
                        icon={<DoubleRightOutlined />}
                        type={"link"}
                    />
                    <Divider type={"vertical"}/>
                    <Button onClick={()=>setShowText(!showText)}>
                        显示{showText ? '原文': '文本'}
                    </Button>
                    {onGenCase ?
                        <Button onClick={handleGenerateCase}>
                            生成用例
                        </Button>
                        :
                        null
                    }
                    {onAsk ?
                        <Button onClick={()=>onAsk(prdText)} disabled={prdText.length === 0}>
                            文档问答
                        </Button>
                        :
                        null
                    }

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
                    <Page width={pdfWidth} pageNumber={currentPage} />
                </Document>
            </div>
        </Drawer>

    );
};

export default PdfPreview;
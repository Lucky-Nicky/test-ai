import React, { useState, useEffect  } from 'react';
import {Button, Drawer, message, Modal, Space} from "antd";

const HtmlPreview = ({url, open, onClose, onGenCase}) => {
    const handleGenerateCase = (event) => {
        // const getSelectedTextInIframe = (iframe) => {
        //     const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
        //     const selection = iframeDocument.getSelection();
        //     const selectedText = selection.toString().trim();
        //
        //     if (selectedText) {
        //         // 如果当前iframe中有选中的文本，则返回选中的文本
        //         return selectedText;
        //     }
        //
        //     // 如果当前iframe没有选中的文本，继续查找嵌套的iframes
        //     const nestedIframes = iframeDocument.getElementsByTagName('iframe');
        //     for (const nestedIframe of nestedIframes) {
        //         const textInNestedIframe = getSelectedTextInIframe(nestedIframe);
        //         if (textInNestedIframe) {
        //             return textInNestedIframe; // 返回最底层iframe的选中文本
        //         }
        //     }
        //
        //     // 如果没有找到选中的文本，返回空字符串或其他适当的值
        //     return '';
        // }
        // const iframe = document.getElementById('preView');
        // const selectedText = getSelectedTextInIframe(iframe);
        // if (!selectedText) {
        //     message.info('请选中你要生成用例的文本');
        //     return;
        // }
        onGenCase();
    };
    return (
        <Drawer
            width={'80%'}
            open={open}
            onClose={onClose}
            footer={(
                <Space>
                    <Button onClick={handleGenerateCase}>
                        生成用例
                    </Button>
                </Space>
            )}
        >
            <iframe
                id={'preView'}
                src={url}
                width={'99%'}
                height={window.innerHeight}
            >

            </iframe>


        </Drawer>

    );
};

export default HtmlPreview;
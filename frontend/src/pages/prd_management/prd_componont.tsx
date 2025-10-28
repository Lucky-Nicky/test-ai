import React, { useState, useEffect  } from 'react';
import {Modal, Space, Tabs, Row, Col, Button, message} from "antd";
import copy from "copy-to-clipboard";

export const JiraInfoModal = (props) => {
    const {open,onOK, type, data} = props;
    const [currentIndex, setCurrentIndex] = useState('1');
    const getItemHtml = (row:any, index:number) =>{
        return (
            <Row key={index}>
                <Col span={1}>
                    {index + 1}.
                </Col>
                <Col span={21}>
                    <Space align={"baseline"}>
                        <a href={row.url} target={"_blank"} style={{whiteSpace: "nowrap"}}>{row.key}</a>
                        <span>{row.summary}</span>
                    </Space>

                </Col>
                <Col span={2}>
                    {row.status}
                </Col>
            </Row>
        )
    };
    const items:any = [
        {
            'key': '1',
            label: '故事',
            children: data?.story?.map((x:any, index:number)=>{
                return getItemHtml(x, index)
            })
        },
        {
            'key': '2',
            label: '缺陷',
            children: data?.bug?.map((x:any, index:number)=>{
                return getItemHtml(x, index)
            })
        }
    ];
    const handleCopy = ()=>{
      if(currentIndex == 1){
          const results = data.story?.map((x)=>{
              return x.summary
          });
          copy(results?.join('\n'))
      }
      else{
          const results = data.bug?.map((x)=>{
              return x.summary
          });
          copy(results?.join('\n'))
      }
      message.success('复制成功')
    };
    useEffect(()=>{
        setCurrentIndex(type);
    }, [type])
    return (
        <Modal
            width={900}
            open={open}
            onOk={onOK}
            onCancel={onOK}
            okText={'关闭'}
            destroyOnClose
            footer={(_, { OkBtn, CancelBtn}) =>(
                <>
                    <Button onClick={handleCopy}>一键复制</Button>
                    <OkBtn />
                </>
            )}
        >
            <Tabs
                activeKey={currentIndex}
                items={items}
                onChange={(key)=> setCurrentIndex(key)}
            />
        </Modal>

    );
};

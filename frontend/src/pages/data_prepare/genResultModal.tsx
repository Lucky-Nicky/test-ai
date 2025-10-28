import React, {FunctionComponent, useState, useEffect} from "react";
import {
    Button,
    Space,
    Modal,
    Table,
    message
} from 'antd'

import {
    DataPrepareDeleteGenDataApi, DataPrepareDownloadApi,
    DataPrepareGetDetailApi
} from "@/apis/dataPrepare";
export const GenResultModal:FunctionComponent = (props: any) =>{
    const {open, onClose, dataPrepareId, genResultType, onDeleteResult} = props;
    const [dataSource, setDataSource] = useState([]);
    const [columns, setColumns] = useState(false);
    const getDetail = async ()=>{
        if (!dataPrepareId){
            return
        }
        const res:any = await DataPrepareGetDetailApi({
            data_prepare_id: dataPrepareId,
        });
        if (res.success){
            if(genResultType === 1){
                setDataSource(res.data.generated_data);
                handleSetGenResultColumns(res.data.generated_data);
            }
            else{
                setDataSource(res.data.generated_data_abnormal);
                handleSetGenResultColumns(res.data.generated_data_abnormal);
            }

        }
    };
    const handleSetGenResultColumns = (resultData:any)=>{
        let keys = [];
        resultData.forEach((item, index, arr) =>{
            keys.push(...Object.keys(item))
            keys = Array.from(new Set(keys));
        })
        let basicGenResultColumns:any = keys.map((x:any)=>{
            if (x === 'key'){
                return {
                    title: '序号',
                    dataIndex: x,
                    key: x,
                    width: 70,
                }
            }
            return {
                title: x,
                dataIndex: x,
                key: x,
                width: 150,
                ellipsis: true
            }
        })
        basicGenResultColumns.push({
            title: '操作',
            dataIndex: 'operation',
            key: 'operation',
            width: 100,
            fixed: 'right',
            render: (text:any, record:any)=>(
                <Space>
                    <Button
                        type={"link"}
                        size={"small"}
                        onClick={()=>{
                            handleDeleteGenResult(record.key);
                        }}
                    >
                        删除
                    </Button>
                </Space>
            )

        })
        setColumns(basicGenResultColumns);
    };
    const handleDeleteGenResult = async (key)=>{
        const res:any = await DataPrepareDeleteGenDataApi({
            data_prepare_id: dataPrepareId,
            key: key,
            data_type: genResultType
        });
        if (res.success){
            message.success('操作成功')
            getDetail();
            onDeleteResult();
        }
    };
    const handleDownloadData = async (data_prepare_id, data_type:number)=>{
        const res:any = await DataPrepareDownloadApi({
            data_prepare_id: data_prepare_id,
            data_type: data_type
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([res.data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
        link.download = res.headers['content-disposition'].split('filename=')[1];
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    useEffect(()=>{
        open && getDetail();
        }, [open]);
    return (
        <Modal
            width={1000}
            title={ genResultType === 1 ? '正向生成结果' : '逆向生成结果'}
            open={open}
            onCancel={onClose}
            footer={[
                <Button
                    type={"primary"}
                    onClick={()=>{
                        handleDownloadData(dataPrepareId, genResultType);
                }}>下载</Button>,
                <Button onClick={onClose}>关闭</Button>
            ]}
        >
            <Table
                columns={columns}
                dataSource={dataSource}
                scroll={{x:800,}}
                pagination={{defaultPageSize:10, showSizeChanger: true}}
            >
            </Table>

        </Modal>
    )
}

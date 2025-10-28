import React, {FunctionComponent, useState, useEffect} from "react";
import {
    Select,
    Spin
} from 'antd';

import {searchJiraSprintApi, searchJiraReleaseApi} from "@/apis/sprint";

export const SearchJiraSprint:FunctionComponent = (props: any) =>{
    const {project_id} = props;
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const handleSearchSprint = async(key:string)=>{
        setLoading(true);
        setOptions([]);
        const res:any = await  searchJiraSprintApi({
            project_id: project_id,
            key: key
        })
        if (res.success){
            setOptions(res.data)
        }
        setLoading(false);
    }
    useEffect(()=>{
        handleSearchSprint('')
    }, [])
    return (
        <Select
            {...props}
            loading={loading}
            showSearch
            onSearch={(value)=>{
                handleSearchSprint(value);
            }}
            options={options}
            notFoundContent={loading ? <Spin size="small" /> : null}
        />

    )
}


export const SearchJiraRelease:FunctionComponent = (props: any) =>{
    const {project_id} = props;
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const handleSearchRelease = async(key:string)=>{
        setLoading(true);
        setOptions([]);
        const res:any = await  searchJiraReleaseApi({
            project_id: project_id,
            key: key
        })
        if (res.success){
            setOptions(res.data)
        }
        setLoading(false);
    }
    useEffect(()=>{
        handleSearchRelease('')
    }, [])
    return (
        <Select
            {...props}
            loading={loading}
            showSearch
            onSearch={(value)=>{
                handleSearchRelease(value);
            }}
            options={options}
            notFoundContent={loading ? <Spin size="small" /> : null}
        />

    )
}

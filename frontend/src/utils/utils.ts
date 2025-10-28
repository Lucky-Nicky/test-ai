export const get_init_project = ()=>{
  const default_project_id = localStorage.getItem('project_id');
  return Number(default_project_id) || null;
}

export const get_init_sub_project = ()=>{
  const default_project_id = localStorage.getItem('sub_project_id');
  return Number(default_project_id) || null;
}


export const get_init_sprint = ()=>{
  const local_sprint_id = localStorage.getItem('sprint_id');
  const url_sprint_id = new URLSearchParams(location.search).get('sprint_id');
  if (local_sprint_id){
    return Number(local_sprint_id)
  }
  if(url_sprint_id){
    return Number(url_sprint_id)
  }
  return ''
}


export const formatDate = (date: any, long:boolean=false) => {
  if (!date) {
    return '';
  }
  long ? date = new Date(parseInt(date)) : date = new Date(parseInt(date) * 1000);
  const year = date.getFullYear();
  const month =
      date.getMonth() + 1 < 10
          ? '0' + (date.getMonth() + 1)
          : date.getMonth() + 1;
  const day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  const hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  const minute =
      date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  const second =
      date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

export const ParseDeltaStr = (fullStr:String) =>{
  try {
    let result = fullStr.match(/\s*({.*?})\s*\n/g);
    // console.log(result);
    return result.map((x) => JSON.parse(x))
  }
  catch (e){
    return []
  }
}

export const ParseDeltaStrGpt = (fullStr:String) =>{
  try {
    let result = fullStr.match(/\s*({.*?})\s*\n/g);
    console.log(result);
    return result.map((x) => JSON.parse(x.trim()))
  }
  catch (e){
    console.log('parse error');
    console.log(e);
    return []
  }
}

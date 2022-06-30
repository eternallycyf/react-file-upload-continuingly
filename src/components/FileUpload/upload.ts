const SparkMD5 = require('spark-md5');
import { Iconfig } from './interface';

class CFileUpload {
  config: Iconfig;
  datas: [] | any;
  id: number | string | null;
  shard_size: number | string;
  min_size: number | string | null;
  check_url: string | null;
  url: string | null;
  headers: string | null;
  type: string | null;
  apped_data: object;
  current_size: number;
  current_time: number;
  result_status: boolean;
  delay_time: number;
  timeout: number;
  dcance_status: number;
  form_data: FormData;
  xhr: XMLHttpRequest;
  error_msg: any;
  dom: HTMLButtonElement | null;
  domtext: null | string;
  filedom: HTMLElement | null;
  shardTotal: number | string;
  shardIndex: number | string;
  cancelStatus: number | string;
  k: any;
  file: any;
  filename: string;
  size: string | number;
  suffix: string;
  progress_num: any;
  shard_time: any;
  alreadyExists: boolean;
  max_size: any;

  constructor(config: Iconfig) {
    this.config = config;
    this.datas = config.datas;
    this.id = '';
    this.shard_size = '2';
    this.min_size = '200';
    this.check_url = '';
    this.url = '';
    this.headers = null;
    this.type = '';
    this.apped_data = {};
    this.current_size = 0;
    this.current_time = 0;
    this.result_status = true;
    this.delay_time = 300;
    this.timeout = 10000;
    this.dcance_status = 0;
    this.form_data = new FormData();
    this.xhr = new XMLHttpRequest();
    this.error_msg = {
      1000: '未找到该上传id',
      1001: '不允许上传的文件类型',
      1002: '上传文件过小',
      1003: '上传文件过大',
      1004: '请求超时',
    };
    this.dom = null;
    this.domtext = null;
    this.filedom = null;
    this.shardTotal = 0;
    this.shardIndex = 0;
    this.cancelStatus = 0;
    this.k = null;
    this.file = null;
    this.filename = '';
    this.size = '';
    this.suffix = '';
    this.progress_num = '';
    this.shard_time = '';
    this.alreadyExists = true;
    this.max_size = '';
    this.extend(config);
  }

  start() {}
  // 默认等待事件
  before_send() {}
  error(err: Error) {
    alert(err);
  }
  success(res: Response) {
    return true;
  }
  check_success(res: Response) {
    return true;
  }
  create_cors() {
    let xhr = new XMLHttpRequest();
    return xhr;
  }
  set_header(xhrs: XMLHttpRequest) {
    let header = this.headers;
    if (header) {
      if (Object.prototype.toString.call(header) === '[object Object]') {
        for (let i in header as any) {
          xhrs.setRequestHeader(i, header[i as any]);
        }
      }
    }
    header = null;
  }
  progress(num: number) {}
  upcheck(md5: any) {
    if (!this.check_url) {
      return false;
    }
    this.form_data.append('file_name', this.config.filename);
    this.form_data.append('file_md5', md5);
    this.form_data.append('file_size', this.config.size);
    this.form_data.append('file_total', this.config.shardTotal);
    if (this.apped_data) {
      this.form_data.append('apped_data', JSON.stringify(this.apped_data));
    }
    let xhrs = new (this.create_cors as any)();
    xhrs.open('POST', this.check_url, false); // 同步
    this.set_header(xhrs);
    xhrs.onreadystatechange = function () {
      if (xhrs.status == 404) {
        return;
      }
      if (xhrs.readyState == 4 && xhrs.status == 200) {
        if (typeof this.config.check_success == 'function') {
          this.config.alreadyExists = this.config.check_success(
            xhrs.responseText,
          );
        }
      }
    };
    xhrs.send(this.form_data);
    this.form_data.delete('file_md5');
    this.form_data.delete('file_name');
    this.form_data.delete('file_size');
    this.form_data.delete('file_total');
    if (this.config.apped_data) {
      this.form_data.delete('apped_data');
    }
    xhrs = null;
  }
  // 设置当前切片
  set_shard(index: number) {
    index = index < 1 ? 1 : index;
    this.config.k = index - 1;
    this.config.shardIndex = index;
  }
  // 取消上传
  cancel() {
    this.config.cancelStatus = 1;
  }
  // 配置参数
  extend(config: any) {
    if (Object.prototype.toString.call(config) === '[object Object]') {
      for (let i in config) {
        this.config[i] = config[i];
      }
      this.init();
    }
  }
  // 初始化操作
  init() {
    if (!this.id) {
      return false;
    }
    let id = this.id;
    this.dom = document.querySelector(`#${id}`);
    if (this.dom === null) {
      this.error(this.error_msg['1000']);
      return;
    }
    this.domtext = this.dom.innerHTML;
    this.credom();
    this.dom.onclick = () => {
      this.config.filedom.click();
    };
    let evt = document.createEvent('HTMLEvents');
    evt.initEvent('change', false, false);
    this.config.start();
  }
  // 注销
  destroy() {
    this.config.datas = [];
    this.config.file = null;
  }
  // 创建元素
  credom() {
    let up_id = 'fcup_' + this.id + '_' + new Date().getTime();
    (this.dom as any).innerHTML =
      this.domtext +
      '<input type="file" id="' +
      up_id +
      '" style="display:none;">';
    this.filedom = document.getElementById(up_id);
    (this.filedom as any).addEventListener('change', this.onevent, false);
  }
  // 触发事件
  onevent() {
    let files = this.config.filedom.files[0];
    this.config.before_send(files);
    this.config.upload(files);
  }
  // 上传处理
  post(md5: any) {
    let shardCount = this.shardTotal;
    let shardIndex = this.shardIndex;
    if (this.cancelStatus == 1) {
      return false;
    }
    if (
      shardIndex >= (shardCount as number) + 1 ||
      this.result_status == false
    ) {
      return false;
    }
    let file = this.datas[this.k];
    this.form_data.append('file_data', file['file_data']);
    this.form_data.append('file_name', file['file_name']);
    this.form_data.append('file_size', file['file_size']);
    this.form_data.append('file_chunksize', file['file_chunksize']);
    this.form_data.append('file_suffix', file['file_suffix']);
    this.form_data.append('file_total', shardCount as string);
    this.form_data.append('file_md5', md5);
    this.form_data.append('file_index', this.shardIndex as string);
    this.current_size += file['file_chunksize'];
    if (this.apped_data) {
      this.form_data.append('apped_data', JSON.stringify(this.apped_data));
    }
    let xhrs = this.create_cors();
    xhrs.open('POST', this.url as string, true);
    this.set_header(xhrs);
    xhrs.timeout = this.timeout;
    xhrs.onloadstart = () => {
      let progress_num = this.config.get_percent(shardIndex, shardCount);
      this.config.progress_num = progress_num > 100 ? 100 : progress_num;
      this.config.startTime = new Date().getTime();
    };
    xhrs.onload = () => {
      this.config.post(md5);
    };
    xhrs.onreadystatechange = () => {
      this.config.result(xhrs);
    };
    xhrs.ontimeout = (e) => {
      this.config.error(this.config.error_msg['1004']);
    };
    xhrs.send(this.form_data);
    this.form_data.delete('file_data');
    this.form_data.delete('file_name');
    this.form_data.delete('file_size');
    this.form_data.delete('file_chunksize');
    this.form_data.delete('file_suffix');
    this.form_data.delete('file_md5');
    this.form_data.delete('file_total');
    this.form_data.delete('file_index');
    if (this.config.apped_data) {
      this.form_data.delete('apped_data');
    }
    this.k++;
    (this.shardIndex as number)++;
  }
  // 时间计算
  compute_time(totalTime: any) {
    if (totalTime < 1000) {
      totalTime = (totalTime / 1000).toFixed(4) + '秒';
    } else {
      if (totalTime >= 1000 * 60) {
        totalTime = Math.floor(totalTime / (1000 * 60)) + '分钟';
      } else {
        totalTime = (totalTime / 1000).toFixed(4) + '秒';
      }
    }
    return totalTime;
  }
  // 结果处理
  result(xhr: any) {
    this.config.result_status = false;
    if (xhr.status == 404) {
      return;
    }
    if (xhr.readyState == 4 && xhr.status == 200) {
      let pertime = Math.round(new Date().getTime() - this.config.startTime);
      this.config.shard_time += pertime;
      if (this.config.progress_num < 80) {
        this.config.cachepertime = pertime;
      }
      let total_time = this.config.cachepertime * this.config.shardTotal;
      if (this.config.shardTotal == 1) {
        total_time = this.config.shard_time;
      }
      let use_time = this.config.shard_time;
      let total_times = this.config.compute_time(total_time);
      let use_times = this.config.compute_time(use_time);
      let type = xhr.getResponseHeader('Content-Type');
      let other: any = {
        totaltime: total_times,
        usetime: use_times,
        current: this.get_conver(this.config.current_size),
        surplus: this.get_conver(this.config.size - this.config.current_size),
        type: type,
      };
      if (typeof this.config.progress == 'function') {
        this.config.progress(this.config.progress_num, other);
      }
      if (typeof this.config.success == 'function') {
        other.progress = this.config.progress_num;
        if (this.config.progress_num == 100) {
          setTimeout(() => {
            this.config.result_status = this.config.success(
              xhr.responseText,
              other,
            );
            this.config.destroy();
          }, this.config.delay_time);
        } else {
          this.config.result_status = this.config.success(xhr.responseText);
        }
      }
    } else {
      if (typeof this.config.beforeSend == 'function') {
        this.config.beforeSend();
      }
    }
  }
  // 参数解析
  post_data(i: number, start: any, end: any) {
    this.datas[i] = [];
    let file = this.file.slice(start, end);
    this.datas[i]['file_data'] = file;
    this.datas[i]['file_name'] = this.filename;
    this.datas[i]['file_size'] = this.size;
    this.datas[i]['file_chunksize'] = file.size;
    this.datas[i]['file_suffix'] = this.suffix;
  }
  // 大小格式
  limit_file_size(limitSize: any) {
    var arr = ['KB', 'MB', 'GB'],
      limit = limitSize.toUpperCase(),
      limitNum = 0;
    for (var i = 0; i < arr.length; i++) {
      var leval = limit.indexOf(arr[i]);
      if (leval > -1) {
        limitNum = parseFloat(limit.substr(0, leval)) * Math.pow(1024, i + 1);
        break;
      }
    }
    return limitNum;
  }
  get_percent(num: any, total: any) {
    num = parseFloat(num);
    total = parseFloat(total);
    if (isNaN(num) || isNaN(total)) {
      return '-';
    }
    return total <= 0 ? 0 : Math.round((num / total) * 10000) / 100.0;
  }
  get_conver(limit: number) {
    let size = '';
    if (limit < 0.1 * 1024) {
      size = limit.toFixed(2) + 'B';
    } else if (limit < 0.1 * 1024 * 1024) {
      size = (limit / 1024).toFixed(2) + 'KB';
    } else {
      size = (limit / (1024 * 1024)).toFixed(2) + 'MB';
    }
    let sizestr = size + '';
    let len = sizestr.indexOf('.');
    let dec = sizestr.substr(len + 1, 2);
    if (dec == '00') {
      return sizestr.substring(0, len) + sizestr.substr(len + 3, 2);
    }
    return sizestr;
  }
  // 上传主函数
  upload(file: any) {
    if (!file) {
      return;
    }
    this.credom();
    this.datas = [];
    this.progress_num = 0;
    this.current_size = 0;
    this.result_status = true;
    this.shard_time = 0;
    this.file = file;
    this.size = file.size;
    this.filename = file.name;
    this.alreadyExists = true;
    let ext = this.filename.lastIndexOf('.'),
      ext_len = this.filename.length;
    this.suffix = this.filename.substring(ext + 1, ext_len).toLowerCase();
    if (this.type) {
      let uptype = this.type.split(',');
      if (uptype.indexOf(this.suffix) == -1) {
        this.error(this.error_msg['1001']);
        return;
      }
    }
    if (this.min_size) {
      let limitNum = this.limit_file_size(this.min_size + 'MB');
      if (file.size < limitNum) {
        this.error(this.error_msg['1002']);
        return;
      }
    }
    if (this.max_size) {
      let limitNum = this.limit_file_size(this.max_size + 'MB');
      if (file.size > limitNum) {
        this.error(this.error_msg['1003']);
        return;
      }
    }
    let chunkSize = 0;
    let chunks: any;
    let currentChunk: number;
    let md5id: number;
    let fileReader: FileReader;
    let spark: any;
    let i = 0,
      blobSlice = File.prototype.slice;
    (chunkSize = +this.shard_size * 1024 * 1024),
      (chunks = Math.ceil(file.size / chunkSize)),
      (currentChunk = 0),
      (md5id = 0),
      (fileReader = new FileReader()),
      (spark = new SparkMD5.ArrayBuffer());

    this.shardTotal = chunks;
    let frOnload = (e: any) => {
      spark.append(e.target.result);
      currentChunk++;
      if (currentChunk < chunks) {
        loadNext();
      } else {
        md5id = spark.end(); // 获取md5
        this.config.md5str = md5id;
        this.config.k = 0;
        this.config.shardIndex = 1;
        this.config.cachepertime = 0;
        this.config.start_upload();
      }
    };
    let frOnerror = function () {};
    fileReader.onload = frOnload;
    fileReader.onerror = frOnerror;
    const loadNext = () => {
      let start = currentChunk * chunkSize,
        end = start + chunkSize >= file.size ? file.size : start + chunkSize,
        filedata = file.slice(start, end);
      this.config.post_data(i, start, end);
      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
      i++;
    };
    loadNext();
  }
  // 开始上传
  start_upload() {
    this.config.upcheck(this.config.md5str); // 检查上传
    if (this.config.alreadyExists == false) {
      return;
    } else {
      this.config.cancelStatus = 0;
      this.config.post(this.config.md5str);
    }
  }
}

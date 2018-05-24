<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="jqUploadify._Default" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>无标题页</title>
    <!-- 下面解决IE9 IE10浏览器不兼容的问题 -->
    <meta http-equiv="X-UA-Compatible" content="IE=EmulateIE7" />
    <link href="uploadify.css" rel="stylesheet" type="text/css" />
    <link href="default.css" rel="stylesheet" type="text/css" />
    <%--  <script src="scripts/jquery-1.7.2.min.js" type="text/javascript"></script>--%>
    <script src="http://server:8089/Resources/Shared/Scripts/jquery/jquery.min.js" type="text/javascript"></script>
    <script src="swfobject.js" type="text/javascript"></script>
    <script src="jquery.uploadify.js" type="text/javascript"></script>
    <script type="text/javascript">
        $(function () {
           var itemTemplate='<div id="${fileID}" class="uploadify-queue-item">\
					<div class="cancel">\
						<a href="javascript:$(\'#${instanceID}\').uploadify(\'cancel\', \'${fileID}\')">X</a>\
					</div>\
					<span class="fileName">${fileName} (${fileSize})</span><span class="data"></span>\
					<div class="uploadify-progress">\
						<div class="uploadify-progress-bar"><!--Progress Bar--></div>\
					</div>\
				</div>';
           itemTemplate = '<tr id="${fileID}" class="upload-success" data-id="${fileID}">\
                <td><span class="file-name">${fileName}</span></td>\
                <td>${fileSize}</td>\
                <td class="center"><a class="preview" title="cctg_150.jpg" href="javascript:void(0);" data-url="" data-spm-anchor-id="a1z28.7294825.0.0"><i class="icon-thumbnail"></i></a></td>\
                <td class="center"><a class="insert" href="javascript:void(0);" name="insert">插入</a></td>\
                <td class="center">\
                    <a class="upload-stat" href="javascript:void(0);"><i class="icon-success"></i></a>\
                </td>\
                <td class="td-re center">\
                    <a class="remove" title="删除" href="javascript:$(\'#${instanceID}\').uploadify(\'cancel\', \'${fileID}\')" name="remove"><i class="icon-remove"></i></a>\
                </td>\
            </tr>';
            $("#file_upload").uploadify({
                //开启调试
                'debug': false,
                //是否自动上传
                'auto': false,
                'buttonText': '选择照片',
                //flash
                'swf': "uploadify.swf",
                //文件选择后的容器ID
                'queueID': 'uploadfileQueue',
                'uploader': 'upload.ashx',
                'width': '75',
                'height': '24',
                'multi': true,
                'fileTypeDesc': '支持的格式：',
                'fileTypeExts': '*.jpg;*.jpge;*.gif;*.png',
                'fileSizeLimit': '1MB',
                'removeTimeout': 1,
                'itemTemplate':itemTemplate,

                //返回一个错误，选择文件的时候触发
                'onSelectError': function (file, errorCode, errorMsg) {
                    switch (errorCode) {
                        case -100:
                            alert("上传的文件数量已经超出系统限制的" + $('#file_upload').uploadify('settings', 'queueSizeLimit') + "个文件！");
                            break;
                        case -110:
                            alert("文件 [" + file.name + "] 大小超出系统限制的" + $('#file_upload').uploadify('settings', 'fileSizeLimit') + "大小！");
                            break;
                        case -120:
                            alert("文件 [" + file.name + "] 大小异常！");
                            break;
                        case -130:
                            alert("文件 [" + file.name + "] 类型不正确！");
                            break;
                    }
                },
                //检测FLASH失败调用
                'onFallback': function () {
                    alert("您未安装FLASH控件，无法上传图片！请安装FLASH控件后再试。");
                },
                //上传到服务器，服务器返回相应信息到data里
                'onUploadSuccess': function (file, data, response) {
                    //alert(data);
                }
            });

//            $("#file_upload").uploadify({
//                height: 30,
//                swf: 'uploadify.swf',
//                uploader: 'upload.ashx',
//                width: 120
//            });


//            debugger
//            $("#file_upload").uploadify({
//                //开启调试
//                'debug': false,
//                //是否自动上传
//                'auto': false,
//                //超时时间
//                'successTimeout': 99999,
//                //附带值
//                'formData': {
//                    'userid': '用户id',
//                    'username': '用户名',
//                    'rnd': '加密密文'
//                },
//                //flash
//                'swf': "uploadify.swf",
//                //不执行默认的onSelect事件
//                'overrideEvents': ['onDialogClose'],
//                //文件选择后的容器ID
//                'queueID': 'uploadfileQueue',
//                //服务器端脚本使用的文件对象的名称 $_FILES个['upload']
//                'fileObjName': 'upload',
//                //上传处理程序
//                'uploader': 'upload.ashx',
//                //浏览按钮的背景图片路径
//                'buttonImage': 'images/SelectFile.gif',
//                //浏览按钮的宽度
//                'width': '100',
//                //浏览按钮的高度
//                'height': '32',
//                //expressInstall.swf文件的路径。
//                'expressInstall': 'expressInstall.swf',
//                //在浏览窗口底部的文件类型下拉菜单中显示的文本
//                'fileTypeDesc': '支持的格式：',
//                //允许上传的文件后缀
//                'fileTypeExts': '*.jpg;*.jpge;*.gif;*.png',
//                //上传文件的大小限制
//                'fileSizeLimit': '4MB',
//                //上传数量
//                'queueSizeLimit': 25,
//                //每次更新上载的文件的进展
//                'onUploadProgress': function (file, bytesUploaded, bytesTotal, totalBytesUploaded, totalBytesTotal) {
//                    //有时候上传进度什么想自己个性化控制，可以利用这个方法
//                    //使用方法见官方说明
//                },
//                //选择上传文件后调用
//                'onSelect': function (file) {

//                },
//                //返回一个错误，选择文件的时候触发
//                'onSelectError': function (file, errorCode, errorMsg) {
//                    switch (errorCode) {
//                        case -100:
//                            alert("上传的文件数量已经超出系统限制的" + $('#file_upload').uploadify('settings', 'queueSizeLimit') + "个文件！");
//                            break;
//                        case -110:
//                            alert("文件 [" + file.name + "] 大小超出系统限制的" + $('#file_upload').uploadify('settings', 'fileSizeLimit') + "大小！");
//                            break;
//                        case -120:
//                            alert("文件 [" + file.name + "] 大小异常！");
//                            break;
//                        case -130:
//                            alert("文件 [" + file.name + "] 类型不正确！");
//                            break;
//                    }
//                },
//                //检测FLASH失败调用
//                'onFallback': function () {
//                    alert("您未安装FLASH控件，无法上传图片！请安装FLASH控件后再试。");
//                },
//                //上传到服务器，服务器返回相应信息到data里
//                'onUploadSuccess': function (file, data, response) {
//                    debugger
//                    alert(data);
//                }
//            });

        });

        function doUplaod() {
            $('#file_upload').uploadify('upload', '*');
        }

        function closeLoad() {
            $('#file_upload').uploadify('cancel', '*');
        }


    </script>
</head>
<body>
    <table width="704" border="0" align="center" cellpadding="0" cellspacing="0" id="__01">
        <tr>
            <td align="center" valign="middle">
               <table id="uploadfileQueue">
               </table>

                <div style="padding: 3px;">
                </div>
                <div id="file_upload">
                </div>
            </td>
        </tr>
        <tr>
            <td height="50" align="center" valign="middle">
                <img alt="" src="images/BeginUpload.gif" width="77" height="23" onclick="doUplaod()"
                    style="cursor: hand" />
                <img alt="" src="images/CancelUpload.gif" width="77" height="23" onclick="closeLoad()"
                    style="cursor: hand" />
            </td>
        </tr>
    </table>
</body>
</html>

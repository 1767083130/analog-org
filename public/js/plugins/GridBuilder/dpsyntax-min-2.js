/**
 * Code Syntax Highlighter.
 * Version 1.3.0
 * Copyright (C) 2004 Alex Gorbatchev.
 * http://www.dreamprojections.com/syntaxhighlighter/
 **/
 
var dp={sh:{Utils:{},Brushes:{},Strings:{},Version:'1.3.0'}};dp.sh.Strings={AboutDialog:'<html><head><title>About...</title></head><body class="dp-about"><table cellspacing="0"><tr><td class="copy"><p class="title">dp.SyntaxHighlighter</div><div class="para">Version: {V}</p><p><a href="http://www.dreamprojections.com/syntaxhighlighter/?ref=about" target="_blank">http://www.dreamprojections.com/SyntaxHighlighter</a></p>&copy;2004-2005 Alex Gorbatchev. All right reserved.</td></tr><tr><td class="footer"><input type="button" class="close" value="OK" onClick="window.close()"/></td></tr></table></body></html>',ExpandCode:'+ expand code',ViewPlain:'view plain',Print:'print',CopyToClipboard:'copy to clipboard',About:'?',CopiedToClipboard:'The code is in your clipboard now.'};dp.SyntaxHighlighter=dp.sh;dp.sh.Utils.Expand=function(sender)
{var table=sender;var span=sender;while(span!=null&&span.tagName!='SPAN')
span=span.parentNode;while(table!=null&&table.tagName!='TABLE')
table=table.parentNode;span.parentNode.removeChild(span);table.tBodies[0].className='show';table.parentNode.style.height='100%';}
dp.sh.Utils.ViewSource=function(sender)
{var code=sender.parentNode.originalCode;var wnd=window.open('','_blank','width=750, height=400, location=0, resizable=1, menubar=0, scrollbars=1');code=code.replace(/</g,'&lt;');wnd.document.write('<pre>'+code+'</pre>');wnd.document.close();}
dp.sh.Utils.ToClipboard=function(sender)
{var code=sender.parentNode.originalCode;if(window.clipboardData)
{window.clipboardData.setData('text',code);alert(dp.sh.Strings.CopiedToClipboard);}}
dp.sh.Utils.PrintSource=function(sender)
{var td=sender.parentNode;var code=td.processedCode;var iframe=document.createElement('IFRAME');var doc=null;var wnd=iframe.style.cssText='position:absolute; width:0px; height:0px; left:-5px; top:-5px;';td.appendChild(iframe);doc=iframe.contentWindow.document;code=code.replace(/</g,'&lt;');doc.open();doc.write('<pre>'+code+'</pre>');doc.close();iframe.contentWindow.focus();iframe.contentWindow.print();td.removeChild(iframe);}
dp.sh.Utils.About=function()
{var wnd=window.open('','_blank','dialog,width=320,height=150,scrollbars=0');var doc=wnd.document;var styles=document.getElementsByTagName('style');var links=document.getElementsByTagName('link');doc.write(dp.sh.Strings.AboutDialog.replace('{V}',dp.sh.Version));for(var i=0;i<styles.length;i++)
doc.write('<style>'+styles[i].innerHTML+'</style>');for(var i=0;i<links.length;i++)
if(links[i].rel.toLowerCase()=='stylesheet')
doc.write('<link type="text/css" rel="stylesheet" href="'+links[i].href+'"></link>');doc.close();wnd.focus();}
dp.sh.Match=function(value,index,css)
{this.value=value;this.index=index;this.length=value.length;this.css=css;}
dp.sh.Highlighter=function()
{this.addGutter=true;this.addControls=true;this.collapse=false;this.tabsToSpaces=true;}
dp.sh.Highlighter.SortCallback=function(m1,m2)
{if(m1.index<m2.index)
return-1;else if(m1.index>m2.index)
return 1;else
{if(m1.length<m2.length)
return-1;else if(m1.length>m2.length)
return 1;}
return 0;}
dp.sh.Highlighter.prototype.GetMatches=function(regex,css)
{var index=0;var match=null;while((match=regex.exec(this.code))!=null)
{this.matches[this.matches.length]=new dp.sh.Match(match[0],match.index,css);}}
dp.sh.Highlighter.prototype.AddBit=function(str,css)
{var span=document.createElement('span');str=str.replace(/&/g,'&amp;');str=str.replace(/ /g,'&nbsp;');str=str.replace(/</g,'&lt;');str=str.replace(/\n/gm,'&nbsp;<br>');if(css!=null)
{var regex=new RegExp('<br>','gi');if(regex.test(str))
{var lines=str.split('&nbsp;<br>');str='';for(var i=0;i<lines.length;i++)
{span=document.createElement('SPAN');span.className=css;span.innerHTML=lines[i];this.div.appendChild(span);if(i+1<lines.length)
this.div.appendChild(document.createElement('BR'));}}
else
{span.className=css;span.innerHTML=str;this.div.appendChild(span);}}
else
{span.innerHTML=str;this.div.appendChild(span);}}
dp.sh.Highlighter.prototype.IsInside=function(match)
{if(match==null||match.length==0)
return;for(var i=0;i<this.matches.length;i++)
{var c=this.matches[i];if(c==null)
continue;if((match.index>c.index)&&(match.index<=c.index+c.length))
return true;}
return false;}
dp.sh.Highlighter.prototype.ProcessRegexList=function()
{for(var i=0;i<this.regexList.length;i++)
this.GetMatches(this.regexList[i].regex,this.regexList[i].css);}
dp.sh.Highlighter.prototype.ProcessSmartTabs=function(code)
{var lines=code.split('\n');var result='';var tabSize=4;var tab='\t';function InsertSpaces(line,pos,count)
{var left=line.substr(0,pos);var right=line.substr(pos+1,line.length);var spaces='';for(var i=0;i<count;i++)
spaces+=' ';return left+spaces+right;}
function ProcessLine(line,tabSize)
{if(line.indexOf(tab)==-1)
return line;var pos=0;while((pos=line.indexOf(tab))!=-1)
{var spaces=tabSize-pos%tabSize;line=InsertSpaces(line,pos,spaces);}
return line;}
for(var i=0;i<lines.length;i++)
result+=ProcessLine(lines[i],tabSize)+'\n';return result;}
dp.sh.Highlighter.prototype.SwitchToTable=function()
{var html=this.div.innerHTML.replace(/<(br)\/?>/gi,'\n');var lines=html.split('\n');var row=null;var cell=null;var tBody=null;var html='';var pipe=' | ';function UtilHref(util,text)
{return'<a href="#" onclick="dp.sh.Utils.'+util+'(this); return false;">'+text+'</a>';}
tBody=document.createElement('TBODY');this.table.appendChild(tBody);if(this.addGutter==true)
{row=tBody.insertRow(-1);cell=row.insertCell(-1);cell.className='tools-corner';}
if(this.addControls==true)
{var tHead=document.createElement('THEAD');this.table.appendChild(tHead);row=tHead.insertRow(-1);if(this.addGutter==true)
{cell=row.insertCell(-1);cell.className='tools-corner';}
cell=row.insertCell(-1);cell.originalCode=this.originalCode;cell.processedCode=this.code;cell.className='tools';if(this.collapse==true)
{tBody.className='hide';cell.innerHTML+='<span><b>'+UtilHref('Expand',dp.sh.Strings.ExpandCode)+'</b>'+pipe+'</span>';}
cell.innerHTML+=UtilHref('ViewSource',dp.sh.Strings.ViewPlain)+pipe+UtilHref('PrintSource',dp.sh.Strings.Print);if(window.clipboardData)
cell.innerHTML+=pipe+UtilHref('ToClipboard',dp.sh.Strings.CopyToClipboard);cell.innerHTML+=pipe+UtilHref('About',dp.sh.Strings.About);}
for(var i=0,lineIndex=this.firstLine;i<lines.length-1;i++,lineIndex++)
{row=tBody.insertRow(-1);if(this.addGutter==true)
{cell=row.insertCell(-1);cell.className='gutter';cell.innerHTML=lineIndex;}
cell=row.insertCell(-1);cell.className='line'+(i%2+1);cell.innerHTML=lines[i];}
this.div.innerHTML='';}
dp.sh.Highlighter.prototype.Highlight=function(code)
{function Trim(str)
{return str.replace(/^\s*(.*?)[\s\n]*$/g,'$1');}
function Chop(str)
{return str.replace(/\n*$/,'').replace(/^\n*/,'');}
function Unindent(str)
{var lines=str.split('\n');var indents=new Array();var regex=new RegExp('^\\s*','g');var min=1000;for(var i=0;i<lines.length&&min>0;i++)
{if(Trim(lines[i]).length==0)
continue;var matches=regex.exec(lines[i]);if(matches!=null&&matches.length>0)
min=Math.min(matches[0].length,min);}
if(min>0)
for(var i=0;i<lines.length;i++)
lines[i]=lines[i].substr(min);return lines.join('\n');}
function Copy(string,pos1,pos2)
{return string.substr(pos1,pos2-pos1);}
var pos=0;this.originalCode=code;this.code=Chop(Unindent(code));this.div=document.createElement('DIV');this.table=document.createElement('TABLE');this.matches=new Array();if(this.CssClass!=null)
this.table.className=this.CssClass;if(this.tabsToSpaces==true)
this.code=this.ProcessSmartTabs(this.code);this.table.border=0;this.table.cellSpacing=0;this.table.cellPadding=0;this.ProcessRegexList();if(this.matches.length==0)
{this.AddBit(this.code,null);this.SwitchToTable();return;}
this.matches=this.matches.sort(dp.sh.Highlighter.SortCallback);for(var i=0;i<this.matches.length;i++)
if(this.IsInside(this.matches[i]))
this.matches[i]=null;for(var i=0;i<this.matches.length;i++)
{var match=this.matches[i];if(match==null||match.length==0)
continue;this.AddBit(Copy(this.code,pos,match.index),null);this.AddBit(match.value,match.css);pos=match.index+match.length;}
this.AddBit(this.code.substr(pos),null);this.SwitchToTable();}
dp.sh.Highlighter.prototype.GetKeywords=function(str)
{return'\\b'+str.replace(/ /g,'\\b|\\b')+'\\b';}
dp.sh.HighlightAll=function(name,showGutter,showControls,collapseAll,firstLine)
{function FindValue()
{var a=arguments;for(var i=0;i<a.length;i++)
{if(a[i]==null)
continue;if(typeof(a[i])=='string'&&a[i]!='')
return a[i]+'';if(typeof(a[i])=='object'&&a[i].value!='')
return a[i].value+'';}
return null;}
function IsOptionSet(value,list)
{for(var i=0;i<list.length;i++)
if(list[i]==value)
return true;return false;}
function GetOptionValue(name,list,defaultValue)
{var regex=new RegExp('^'+name+'\\[(\\w+)\\]$','gi');var matches=null;for(var i=0;i<list.length;i++)
if((matches=regex.exec(list[i]))!=null)
return matches[1];return defaultValue;}
var elements=document.getElementsByName(name);var highlighter=null;var registered=new Object();var propertyName='value';if(elements==null)
return;for(var brush in dp.sh.Brushes)
{var aliases=dp.sh.Brushes[brush].Aliases;if(aliases==null)
continue;for(var i=0;i<aliases.length;i++)
registered[aliases[i]]=brush;}
for(var i=0;i<elements.length;i++)
{var element=elements[i];var options=FindValue(element.attributes['class'],element.className,element.attributes['language'],element.language);var language='';if(options==null)
continue;options=options.split(':');language=options[0].toLowerCase();if(registered[language]==null)
continue;highlighter=new dp.sh.Brushes[registered[language]]();element.style.display='none';highlighter.addGutter=(showGutter==null)?!IsOptionSet('nogutter',options):showGutter;highlighter.addControls=(showControls==null)?!IsOptionSet('nocontrols',options):showControls;highlighter.collapse=(collapseAll==null)?IsOptionSet('collapse',options):collapseAll;highlighter.firstLine=(firstLine==null)?parseInt(GetOptionValue('firstline',options,1)):firstLine;highlighter.Highlight(element[propertyName]);var div=document.createElement('DIV');div.className='dp-highlighter';div.appendChild(highlighter.table);element.parentNode.insertBefore(div,element);}}
dp.sh.Brushes.Xml=function()
{this.CssClass='dp-xml';}
dp.sh.Brushes.Xml.prototype=new dp.sh.Highlighter();dp.sh.Brushes.Xml.Aliases=['xml','xhtml','xslt','html','xhtml'];dp.sh.Brushes.Xml.prototype.ProcessRegexList=function()
{function push(array,value)
{array[array.length]=value;}
var index=0;var match=null;var regex=null;this.GetMatches(new RegExp('<\\!\\[[\\w\\s]*?\\[(.|\\s)*?\\]\\]>','gm'),'cdata');this.GetMatches(new RegExp('<!--\\s*.*\\s*?-->','gm'),'comments');regex=new RegExp('([\\w-\.]+)\\s*=\\s*(".*?"|\'.*?\'|\\w+)*','gm');while((match=regex.exec(this.code))!=null)
{push(this.matches,new dp.sh.Match(match[1],match.index,'attribute'));if(match[2]!=undefined)
{push(this.matches,new dp.sh.Match(match[2],match.index+match[0].indexOf(match[2]),'attribute-value'));}}
this.GetMatches(new RegExp('</*\\?*(?!\\!)|/*\\?*>','gm'),'tag');regex=new RegExp('</*\\?*\\s*([\\w-\.]+)','gm');while((match=regex.exec(this.code))!=null)
{push(this.matches,new dp.sh.Match(match[1],match.index+match[0].indexOf(match[1]),'tag-name'));}}
dp.sh.Brushes.Php=function()
{var keywords='and or xor __FILE__ __LINE__ array as break case '+'cfunction class const continue declare default die do echo else '+'elseif empty enddeclare endfor endforeach endif endswitch endwhile eval exit '+'extends for foreach function global if include include_once isset list '+'new old_function print require require_once return static switch unset use '+'var while __FUNCTION__ __CLASS__';this.regexList=[{regex:new RegExp('//.*$','gm'),css:'comment'},{regex:new RegExp('/\\*[\\s\\S]*?\\*/','g'),css:'comment'},{regex:new RegExp('"(?:[^"\n]|[\"])*?"','g'),css:'string'},{regex:new RegExp("'(?:[^'\n]|[\'])*?'",'g'),css:'string'},{regex:new RegExp('\\$\\w+','g'),css:'vars'},{regex:new RegExp(this.GetKeywords(keywords),'gm'),css:'keyword'}];this.CssClass='dp-c';}
dp.sh.Brushes.Php.prototype=new dp.sh.Highlighter();dp.sh.Brushes.Php.Aliases=['php'];dp.sh.Brushes.JScript=function()
{var keywords='abstract boolean break byte case catch char class const continue debugger '+'default delete do double else enum export extends false final finally float '+'for function goto if implements import in instanceof int interface long native '+'new null package private protected public return short static super switch '+'synchronized this throw throws transient true try typeof var void volatile while with';this.regexList=[{regex:new RegExp('//.*$','gm'),css:'comment'},{regex:new RegExp('/\\*[\\s\\S]*?\\*/','g'),css:'comment'},{regex:new RegExp('"(?:[^"\n]|[\"])*?"','g'),css:'string'},{regex:new RegExp("'(?:[^'\n]|[\'])*?'",'g'),css:'string'},{regex:new RegExp('^\\s*#.*','gm'),css:'preprocessor'},{regex:new RegExp(this.GetKeywords(keywords),'gm'),css:'keyword'}];this.CssClass='dp-c';}
dp.sh.Brushes.JScript.prototype=new dp.sh.Highlighter();dp.sh.Brushes.JScript.Aliases=['js','jscript','javascript'];
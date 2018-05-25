<%@ WebHandler Language="C#"Class="Handler" %>

using System;
using System.Web;
public class Handler :IHttpHandler {
    public void ProcessRequest (HttpContext context) {
        Object obj = context.Request.Params["action"];
		string as_action = "query";
		if(obj!=null){
			as_action = obj.ToString();
		}
		obj = context.Request.Params["us"];
		if(obj==null){
			context.Response.Write("�û�������Ϊ��");
			return;
		}
		string as_name = obj.ToString();
        context.Response.ContentType= "text/html";
		if(as_action=="query")
		{
        	context.Response.Write((DbHelperOleDb.GetSingle(string.Format("select count(*) from tb_user where username='{0}'", as_name))).ToString());
		}
		else
		{
			context.Response.Write(AddUser(as_name));
		}
        
    }

    public bool IsReusable {
        get {
            return false;
        }
    }


    private string CheckUser(string as_name)
    {
        return (DbHelperOleDb.GetSingle(string.Format("select count(*) from tb_user where username='{0}'", as_name))).ToString();
    }

    private string AddUser(string as_name)
    {
        if (Convert.ToInt32(DbHelperOleDb.GetSingle("select count(*) from tb_user")) > 1000)
        {
            throw new ApplicationException("������û���¼���Ѿ�����è�����õ�������(1000)���뵽QQȺ��֪ͨè�������¼");
        }
        if (CheckUser(as_name) == "0")
        {
            return Insert(as_name);
        }
        else
        {
            return "0";
        }

    }

    private string Insert(string as_name)
    {
        try
        {
            return DbHelperOleDb.ExecuteSql(string.Format("insert into tb_user(username) values('{0}')", as_name)).ToString();
        }
        catch (Exception ex)
        {
            return "0";
        }
    }
}

var html = document.getElementsByTagName("html")[0]
var lang = localStorage.getItem("language") 

if(lang === "ar"){
    html.setAttribute("dir", "rtl")
    html.setAttribute("lang", "ar")
}else{
    html.setAttribute("dir", "ltr")
    html.setAttribute("lang", "en")
}


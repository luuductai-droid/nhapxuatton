const LANG = {

vi:{
dashboard:"Tổng Quan",
inventory:"Kho Hàng",
scanner:"Quét Mã",
recent:"Hoạt Động Gần Đây"
},

en:{
dashboard:"Dashboard",
inventory:"Inventory",
scanner:"Scanner",
recent:"Recent Activity"
}

}

let currentLang="vi"

function setLanguage(lang){

currentLang=lang

document.getElementById("tab-dashboard").innerText=LANG[lang].dashboard
document.getElementById("tab-inventory").innerText=LANG[lang].inventory
document.getElementById("tab-scanner").innerText=LANG[lang].scanner

document.getElementById("recentTitle").innerText=LANG[lang].recent

}

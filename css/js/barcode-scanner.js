class BarcodeScanner {

constructor(onScanSuccess,onScanError){

this.onScanSuccess=onScanSuccess
this.onScanError=onScanError
this.scanner=null
this.isScanning=false

}

async initialize(){

try{

await navigator.mediaDevices.getUserMedia({video:true})

this.scanner=new Html5Qrcode("reader")

return true

}catch(error){

console.error(error)
return false

}

}

async start(){

if(this.isScanning) return

try{

const config={
fps:25,

qrbox:function(width,height){

const size=Math.min(width,height)*0.9

return{
width:size,
height:size
}

},

aspectRatio:1.777
}

const cameras=await Html5Qrcode.getCameras()

if(!cameras || cameras.length===0){

alert("Không tìm thấy camera")
return

}

let cameraId=cameras[cameras.length-1].id

for(let i=0;i<cameras.length;i++){

const label=cameras[i].label.toLowerCase()

if(
label.includes("back")||
label.includes("rear")||
label.includes("environment")
){

cameraId=cameras[i].id
break

}

}

await this.scanner.start(
cameraId,
config,
this.handleScanSuccess.bind(this),
this.handleScanError.bind(this)
)

this.isScanning=true

document.getElementById("startScanBtn").style.display="none"
document.getElementById("stopScanBtn").style.display="block"

}catch(error){

console.error(error)

if(this.onScanError){
this.onScanError(error.message)
}

}

}

stop(){

if(this.scanner && this.isScanning){

this.scanner.stop()

this.isScanning=false

document.getElementById("startScanBtn").style.display="block"
document.getElementById("stopScanBtn").style.display="none"

}

}

async handleScanSuccess(barcode){

if(navigator.vibrate){
navigator.vibrate(200)
}

this.playBeep()

document.getElementById("scanResult").innerHTML=
"<div class='scan-box'>Barcode: "+barcode+"</div>"

await this.lookupProduct(barcode)

}

handleScanError(err){

if(err.includes("No MultiFormat")){
return
}

console.warn(err)

}

async lookupProduct(barcode){

try{

const url=API_URL+"?action=getByBarcode&barcode="+barcode

const res=await fetch(url)

const data=await res.json()

if(data.success){

this.showProduct(data.data)

}else{

this.showAddProduct(barcode)

}

}catch(e){

console.error(e)

}

}

showProduct(product){

const html=`

<div class="product-card">

<h3>${product.productName}</h3>

<p>Barcode: ${product.barcode}</p>

<p>Stock: ${product.quantity}</p>

<button onclick="updateStock('${product.barcode}',1)">➕ Nhập kho</button>

<button onclick="updateStock('${product.barcode}',-1)">➖ Xuất kho</button>

</div>

`

document.getElementById("scanResult").innerHTML=html

}

showAddProduct(barcode){

document.getElementById("modalBarcode").value=barcode
document.getElementById("modalBarcodeDisplay").value=barcode

document.getElementById("productModal").style.display="block"

}

playBeep(){

try{

const ctx=new(window.AudioContext||window.webkitAudioContext)()

const osc=ctx.createOscillator()

const gain=ctx.createGain()

osc.connect(gain)
gain.connect(ctx.destination)

osc.frequency.value=800

gain.gain.value=0.5

osc.start()
osc.stop(ctx.currentTime+0.1)

}catch(e){}

}

}
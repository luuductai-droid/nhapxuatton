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

console.error("Init error:",error)
return false

}

}

async start(){

if(this.isScanning) return

try{

const config={
fps:20,
qrbox:{width:250,height:250},
aspectRatio:1.777
}

const cameras=await Html5Qrcode.getCameras()

if(!cameras || cameras.length===0){
alert("Không tìm thấy camera")
return
}

let cameraId=cameras[cameras.length-1].id

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

console.error("Start error:",error)

if(this.onScanError){
this.onScanError(error.message)
}

}

}

stop(){

if(this.scanner && this.isScanning){

this.scanner.stop().then(()=>{

this.isScanning=false

document.getElementById("startScanBtn").style.display="block"
document.getElementById("stopScanBtn").style.display="none"

})

}

}

async handleScanSuccess(barcode){

if(navigator.vibrate){
navigator.vibrate(200)
}

this.playBeep()

document.getElementById("scanResult").innerHTML=
"<div class='scan-box'>Barcode: "+barcode+"</div>"

if(this.onScanSuccess){
this.onScanSuccess(barcode)
}

}

handleScanError(err){

if(err.includes("No MultiFormat")){
return
}

console.warn(err)

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

function register({ registerHook }) {
    registerHook({
        target: 'action:embed.player.loaded',
        handler: async ({ player, videojs, video }) => {
            if (typeof window.webln !== 'undefined') {
                console.log('WebLN is available!');
                console.log(window.location.href);
              } else {
                return;
              }
            let x = document.getElementsByClassName("vjs-control-bar");
            let butt = document.createElement("span");
            butt.ariaHidden = "true"
            butt.class = `vjs-fullscreen-control vjs-control vjs-button`
            butt.type = "button";
            butt.title = "send sats to creators";
            butt.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0" width="40" height="40" id="Stylized Lightning Bolt on Circle">
            <defs>
              <radialGradient id="CircleGradient" gradientUnits="userSpaceOnUse" cx="20" cy="20" fx="20" fy="20" r="13">
                <stop offset="0%" stop-color="#FFFF00" stop-opacity="1.0"/>
                <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0"/>
              </radialGradient>
            </defs>
            <ellipse fill="#FF8000" stroke="#000000" stroke-width="1" cx="20" cy="20" rx="13" ry="13" id="Background Circle"/>
            <ellipse fill="url(#CircleGradient)" fill-opacity="1.0" cx="20" cy="20" rx="13" ry="13" id="Shading Circle"/>
            <path fill="#FFFF00" stroke="#000000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" d="M 36,4 L 12,16 18,21 4,36 28,24 22,19 Z" id="Lightning Bolt"/>
          </svg></span><span class="vjs-control-text" aria-live="polite">Zap</span>`;
            butt.id = "zap-button"
            x[0].appendChild(butt);
            let zap = document.getElementById('zap-button');
            zap.onclick = async function () {
                zap.hidden=true;
                try {
                    let supported = await checkWebLnSupport();
                    if (supported < 1) {
                        return;
                    }
                } catch {
                    console.log("error checking for webln support in browser");
                    return;
                }
                let wow = `<div id="zap-dialog" style="background-color: #000000; color: #ffffff;">From:<input type="text" id="zap-from" value="viewer" maxlength="28">
                Sats:<input type="text" id="zap-sats" value="10000" size="8"><br>
               <textarea cols="50" id="zap-message"></textarea>
                <button _ngcontent-vww-c178="" id="zap-send" class="peertube-button orange-button ng-star-inserted">⚡️Boost⚡️</button></div>`;
                let zapDialog = document.createElement('div');
                zapDialog.innerHTML=wow;
                let errorBlock = document.getElementById("error-block");
                console.log(errorBlock.innerHTML)
                errorBlock.parentElement.insertBefore(zapDialog,errorBlock);
                let zapButton=document.getElementById("zap-send");
                let zapHandle = document.getElementById("")
                zapButton.onclick = async function () {
                    
                    let creator = video.channel.name + "@" + video.channel.host;
                    let wallet = await getWalletInfo(creator);
                    let tb =  document.getElementById('zap-sats').value;
                    console.log(tb);
                    let totalBoost=parseInt(tb);
                    console.log(totalBoost);
                    let from = document.getElementById('zap-from').value;
                    let message= document.getElementById('zap-message').value
                    for (var split of wallet){
                        zapButton.innerText="sending";
                        let splitAmount = (totalBoost*split.split)/100
                        console.log(splitAmount);
                        if (split.keysend){
                            console.log("trying keysend",split);
                            await boost(split,splitAmount,totalBoost,from,message);
                        } else if (split.lnurl){
                            console.log("trying lnurl",split);
                            await sendSats(split,splitAmount,message)
                        }
                        zapButton.innerText="Zapped!"
                    }
                    zapDialog.remove();
                    zap.hidden=false;
                }
            }
            async function checkWebLnSupport() {
                try {
                    await webln.enable()
                    if (typeof webln.keysend === 'function') {
                        console.log('✅ webln keysend support');
                        return 2;
                    } else {
                        console.log("✅ webln supported ⛔️ keysend not supported");
                        return 1;
                    }
                } catch {
                    console.log("⛔️ webln not supported");
                    return 0;
                }
            }
            async function boost(walletData, amount, totalAmount,from,message) {
                if (parseInt(amount) < 1) {
                    amount = "1";
                }
                const boost = {
                    action: "boost",
                    value_msat: amount * 1000,
                    value_msat_total: totalAmount * 1000,
                    app_name: "PeerTube",
                    app_version: "4.2.0",
                    name: walletData.name,
                };
                boost.message = message;
                boost.sender_name = from;
                boost.podcast = video.channel.displayName;
                boost.episode = video.title;
                let shortUrl = "https://"+video.channel.host+"/w/"+video.shortUUID;
                boost.url = shortUrl;
                console.log(window.top);
                //boost.link = window.top.location.href;
                boost.link =shortUrl;
                boost.episode_guid = video.uuid
                let pubKey = walletData.keysend.pubkey;
                let customKeyHack, customValue
                if (walletData.keysend.customData) {
                    customKeyHack = walletData.keysend.customData[0].customKey;
                    customValue = walletData.keysend.customData[0].customValue;
                }
                let paymentInfo;
                if (customValue) {
                    paymentInfo = {
                        destination: pubKey,
                        amount: amount,
                        customRecords: {
                            7629169: JSON.stringify(boost),
                            [customKeyHack]: customValue,
                        }
                    };
                } else {
                    paymentInfo = {
                        destination: pubKey,
                        amount: amount,
                        customRecords: {
                            7629169: JSON.stringify(boost),
                        }
                    };
                }
                console.log("payment info", paymentInfo,boost);
                let result;
                try {
                    result = await webln.keysend(paymentInfo);
                    return result;
                } catch (err) {
                    console.log("error attempting to send sats using keysend", err.message);
                    return;
                }
            }
            async function getWalletInfo() {
                let videoName = video.name;
                let channelName = video.channel.name;
                let instanceName = video.channel.host;
                let walletApi = "https://" + instanceName + "/plugins/lightning/router/getsplit";
                if (channelName) {
                    walletApi = walletApi + "?channel=" + channelName;
                }
                if (instanceName) {
                    walletApi = walletApi + "@" + instanceName;
                }
                let walletData;
                try {
                    let response = await fetch(walletApi);
                    let responseOK = response && response.ok;
                    if (responseOK) {
                        walletData = await response.json();
                    } else {
                        console.log("response not ok", response);
                    }
                } catch (err) {
                    console.log("client unable to fetch wallet data\n", walletApi, err);
                    return;
                }
                return walletData;
            }
            async function sendSats(walletData, amount) {
                let message = "zap";
                let from = "embedded viewer";
                console.log("sending lnurl boost", walletData, amount, message, from);
                let result;
                if (!from) {
                  from = "";
                } else {
                  from = from + ": ";
                }
                if (!message) {
                  message = "";
                }
                let comment = from + message;
                amount = amount * 1000
                console.log("webln enabled:");
                let urlCallback = encodeURI(walletData.lnurl.callback);
                let invoiceMessage = encodeURIComponent(comment);
                let invoiceRequest = urlCallback + "?amount=" + amount + "&comment=" + invoiceMessage;
                try {
                    let response = await fetch(invoiceRequest);
                    let responseOK = response && response.ok;
                    if (responseOK) {
                        result = await response.json();
                    } else {
                        console.log("response not ok", response);
                    }
                } catch (err) {
                    console.log("client unable to fetch invoice", invoiceRequest, err);
                    return;
                }
                try {
                    result = await window.webln.sendPayment(result.pr);
                } catch (err) {
                  console.log("failed sending webln lnurl" + tipVerb + "\n" + err.message);
                }
            }
        }
    })
}
export {
    register
}


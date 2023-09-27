import axios from 'axios';
function register({ registerHook, peertubeHelpers }) {
    registerHook({
        target: 'action:video-edit.init',
        handler: async () => {
            const { notifier } = peertubeHelpers;
            const basePath = await peertubeHelpers.getBaseRouterRoute();
            let uuidFromUrl = (window.location.href).split("/").pop();
            console.log("url",window.location.href);
            var apiCall = "/api/v1/videos/" + uuidFromUrl;
            let videoData;
            try {
                videoData = await axios.get(apiCall);
            } catch {
                console.log("⚡️⚡️failed to pull information for provided video id", apiCall);
            }
            console.log("⚡️⚡️ video buggery", videoData);
            let splitInfo = await getSplit();
            console.log("split info",splitInfo);
            let liveValue;
            let liveValueApi = basePath + `/getlivevalue?video=` + uuidFromUrl;
            try {
              let liveValueData = await axios.get(liveValueApi);
              liveValue = liveValueData.data;
              console.log("wtfbbq",liveValue,liveValueData);
            } catch (e) {
              console.log("⚡️⚡️ error getting livevalue", liveValueApi);
              notifier.error(liveValueApi,e);
            }
            let splitKitId;
            let splitKitApi = basePath + `/getsplitkitid?video=` + uuidFromUrl;
            try {
              let splitKitData = await axios.get(splitKitApi);
              splitKitId = splitKitData.data;
              console.log("wtfbbq",splitKitId,splitKitData);
            } catch (e) {
              console.log("⚡️⚡️ error getting value time", splitKitApi);
              notifier.error(splitKitApi,e);
            }
            console.log("⚡️⚡️ split kit import id", splitKitId,"live value",liveValue);            
            let html;
            if (splitInfo && splitInfo.length > 0) {
                html = `<br><label _ngcontent-msy-c247="" for="Wallet">Episode Splits</label>`
                html = html + await makePanelHtml(splitInfo,html);
            }
            if (videoData.data.isLive){
                html = html+ `<br><label for="livevalue">Live Value URL</label><input type="text" id="livevalue" value="${liveValue}">`;
                html = html +`<button id="update-live-value">Update Live Value</button>`;
            } else {
                html = html+ `<br><label for="splitkit">Split kit import ID</label><input type="text" id="splitkit" value="${splitKitId}">`;
                html = html +`<button id="update-split-kit">Update Split Kit Import ID</button>`;
            }
            await addPanel(html);
            let updateButton = document.getElementById("update-live-value");
            if (updateButton){
                updateButton.onclick = async function () {
                    liveValue = document.getElementById('livevalue').value;
                    let liveValueApi = basePath + `/setlivevalue?video=${uuidFromUrl}&url=${liveValue}`;
                    console.log("⚡️⚡️updating live value", liveValue,liveValueApi );
                    let result;
                    if (liveValue){
                        try {
                            result = axios.get(liveValueApi);
                        } catch {
                            console.log("⚡️⚡️ error setting livevalue", liveValueApi); 
                        }
                    }
                    console.log(result);
                }
            }
            let updateSplitKitButton = document.getElementById("update-split-kit");
            if (updateSplitKitButton){
                updateSplitKitButton.onclick = async function () {
                    splitKitId = document.getElementById('splitkit').value;
                    let splitKitApi = basePath + `/setsplitkitid?video=${uuidFromUrl}&id=${splitKitId}`;
                    console.log("⚡️⚡️updating split kit import id", splitKitId,splitKitApi );
                    let result;
                    if (splitKitId){
                        try {
                            result = axios.get(splitKitApi);
                        } catch {
                            console.log("⚡️⚡️ error setting split kit import api", splitKitApi,splitKitId); 
                        }
                }
                    console.log(result);
                }          
            }  
            async function makeKeysendHtml(splitData, slot, ks) {
                let html;
                html = `<label for="name">Split Name:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-name" value="` + splitData[slot].name + `"><br>`;
                if (slot == 0) {
                html = html + `<label for="split">Split Percentage:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-value" readonly value="` + splitData[slot].split + `"><br>`;
                } else {
                html = html + `<label for="split">Split Percentage:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-value" value="` + splitData[slot].split + `"><br>`;
                }
                // html = html + "Enter lightning address (i.e errhead@getalby.com) or the pubkey of a lightning node<br>";

                if (ks) {
                html = html + `<label for="address">Lightning Address:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-address" readonly value ="` + splitData[slot].address + `"><br>`;
                } else {
                html = html + `<label for="address">Lightning Address:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-address" value ="` + splitData[slot].address + `"><br>`;
                }
                let customKey,customValue,status,pubKey;
                html = html + `<hr>  <input type="checkbox" id="manualkeysend" name="manualkeysend">`;
                html = html + `<label for="manualkeysend"> Custom Keysend Configuration</label><br>`;
                if (splitData[slot].keysend) {
                status = splitData[slot].keysend.status;
                pubKey = splitData[slot].keysend.pubkey;
                if (splitData[slot].keysend.customData){
                    customKey = splitData[slot].keysend.customData[0].customKey;
                    customValue = splitData[slot].keysend.customData[0].customValue;
                }
                } 
                if (!customKey) {
                customKey = "";
                }
                if (!customValue) {
                customValue = "";
                }
                if (ks) {
                html = html + `<label for="address">Keysend pubkey:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-pubkey" value ="` + pubKey + `">`;
                html = html + `<br><label for="address">Custom Key:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-customkey" value ="` + customKey + `">`;
                html = html + `<br><label for="address">Custom Value:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-customvalue" value ="` + customValue + `">`;
                } else {
                html = html + "Keysend: " + status;
                html = html + "<br> Keysend pubkey: " + pubKey;
                html = html + "<br> keysend custom key:" + customKey;
                html = html + "<br> keysend custom value:" + customValue;
                }
                if (splitData[slot].lnurl) {
                html = html + "<br> LNURL callback: " + splitData[slot].lnurl.callback;
                }
                html = html + `<hr><button class="peertube-button orange-button ng-star-inserted" slot= "` + slot + `" id="update-split">Update Split</button>`;
                if (slot != 0) {
                html = html + ` - <button class="peertube-button orange-button ng-star-inserted" slot= "` + slot + `" id="remove-split">remove this Split</button>`;
                }
                return html;
            }
            async function closeModal() {
                let butts = document.getElementsByClassName("ng-star-inserted")
                for (var butt of butts) {
                    let iconName = butt.getAttribute("iconname");
                    if (iconName == "cross") {
                        butt.click();
                        return true;
                    }
                }
                return false;
            }
            async function sleep (ms) {
                await new Promise(resolve => setTimeout(resolve, ms))
            }
            async function makePanelHtml (splitInfo,html){
            if (splitInfo && splitInfo.length > 0) {
                html = "<table><th>Split %</th><th><center>Lighting Address</center></th><th>Address Type</th></tr>";
                for (var split in splitInfo) {
                    let displayName = splitInfo[split].name;
                    if (!displayName) {
                        displayName = splitInfo[split].address;
                    }
                    html = html + "<tr><td>" + splitInfo[split].split + "</td><td>" + displayName + "</td>";
                    if (splitInfo[split].keysend) {
                        html = html + `<td>Keysend</td>`;
                    } else if (splitInfo[split].customKeysend) {
                        html = html + `<td>Node</td>`;
                    } else if (splitInfo[split].lnurl) {
                        html = html + "<td>LNURL Pay</td>";
                    } else {
                        html = html + "<td>unknown</td>"
                    }
                    if (!splitInfo[split].fee) {
                        html = html + `<td><div class="peertube-button orange-button ng-star-inserted" slot="` + split + `" id="edit-` + split + `">edit</div></td>`;
                        //html = html + `<td><button class="peertube-button orange-button ng-star-inserted" >edit</button></td>`;
                    }
                    html = html + "</tr>";
                }
                html = html + "</table>";
            }
            html = html + `<button type="button" id="add-split" class="peertube-button orange-button ng-star-inserted">Add Split</button>`
            return html    
            }
            async function editButtons(splitInfo,editSlot,ks){
                let updateSplit = document.getElementById("update-split")
                if (updateSplit) {
                    updateSplit.onclick = async function () {
                        console.log("update split clicked", uuidFromUrl, editSlot, ks)
                        //let updateResult = await doUpdateSplit(channel, slot, ks);
                        let newSplit = document.getElementById("modal-split-value").value;
                        let newAddress = document.getElementById("modal-split-address").value;
                        let newName = encodeURI(document.getElementById("modal-split-name").value);
                        let customKeysend = document.getElementById("manualkeysend").checked
                        console.log("New values from split dialog", customKeysend, newName, newAddress, newSplit, editSlot, ks);
                        if (ks) {
                        var pubKey = document.getElementById("modal-split-pubkey").value
                        var customKey = document.getElementById("modal-split-customkey").value
                        var customValue = document.getElementById("modal-split-customvalue").value
                        } else {
                        var pubKey, customKey, customValue;
                        }
                        console.log("new values 2",pubKey,customKey,customValue);
                        let updateApi = `/updatesplit?video=` + uuidFromUrl + `&split=` + newSplit + `&splitaddress=` + newAddress + `&slot=` + editSlot;
                        if (newName) {
                        updateApi = updateApi + `&name=` + newName;
                        }
                        if (ks) {
                        updateApi = updateApi + `&customkeysend=true`
                        if (customKey) {
                            updateApi = updateApi + `&customkey=` + customKey;
                        }
                        if (customValue) {
                            updateApi = updateApi + `&customvalue=` + customValue;
                        }
                        if (pubKey) {
                            updateApi = updateApi + `&node=` + pubKey;
                        }
                        console.log("update api",updateApi);
                        }
                        let updateResult;
                        try {
                        updateResult = await axios.get(basePath + updateApi);
                        await closeModal();
                        notifier.success("updated " + uuidFromUrl + " splits");
                        await addPanel(await makePanelHtml(await getSplit()));
                        } catch {
                        console.log("unable to update split\n", updateApi);
                        notifier.error("unable to update splits for " + uuidFromUrl);
                        }
                    }
                }
                let removeSplit = document.getElementById("remove-split")
                if (removeSplit) {
                    removeSplit.onclick = async function () {
                        //let removeResult = await doRemoveSplit(cha, slot);
                        let removeApi = `/removesplit?video=` + uuidFromUrl + `&slot=` + editSlot;
                        let removeResult;
                        try {
                            removeResult = await axios.get(basePath + removeApi);
                            await closeModal();
                            notifier.success("Removed split");
                            await addPanel(await makePanelHtml(await getSplit()));
                            return removeResult.data;
                        } catch {
                            console.log("unable to remove split\n", removeApi);
                            notifier.error("unable to remove split");
                            return;
                        }
                        
                    }
                }
                let manualKeysend = document.getElementById("manualkeysend");
                if (manualKeysend) {
                    manualKeysend.checked = ks;
                    manualKeysend.onclick = async function () {
                        console.log("custom keysend data", manualKeysend, ks, splitInfo[editSlot]);
                        if (ks == true) {
                            splitInfo[editSlot].customKeysend = false;
                            ks = false;
                            manualKeysend.checked = false
                        } else {
                            splitInfo[editSlot].customKeysend = true;
                            ks = true;
                            manualKeysend.checked = true;
                        }
                        console.log("post toggle custom keysend data", manualKeysend, editSlot, ks, splitInfo[editSlot].customKeysend);
                        let html = await makeKeysendHtml(splitInfo, editSlot, ks);
                        let modal = (document.getElementsByClassName('modal-body'))
                        modal[0].setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
                        modal[0].innerHTML = html;
                        await editButtons(splitInfo,editSlot,ks);
                    }
                }
            }
            async function addPanel (html){
                let panel = document.createElement('div');
                panel.setAttribute('class', 'lightning-button');
                panel.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
                panel.setAttribute('id','episodesplitpanel');
                panel.innerHTML = html;
                
                let countnap=0;
                let oldpanel = document.getElementById('episodesplitpanel');
                if (oldpanel){
                    oldpanel.remove();
                }
                let spot = document.getElementById("ngb-nav-0-panel");
                while (!spot && countnap<100){
                    countnap++;
                    spot = document.getElementById("ngb-nav-"+countnap+"-panel");
                }
                console.log("spot info",spot);
                if (!spot){
                    console.log("unable to add to html page");
                    return;
                }
                spot.append(panel);
                let addButton = document.getElementById("add-split");
                if (addButton) {
                    addButton.onclick = async function () {
                        await peertubeHelpers.showModal({
                            title: 'Add Split',
                            content: ` `,
                            close: true,
                            confirm: { value: 'X', action: () => { } },
                        })
                        let modal = (document.getElementsByClassName('modal-body'))
                        //modal[0].setAttribute('class', 'lightning-button');
                        modal[0].setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
                        modal[0].innerHTML = `<label for="name">Display Name:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-name" value=""><br>
                        Enter lightning address (i.e errhead@getalby.com) or the pubkey of a lightning node<br><label for="split">Split Percentage:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-value" value="1"><br>
                        <label for="address">Lightning Address:</label><input style="color: #000000; background-color: #ffffff;"  type="text" id="modal-split-address"><br>
                        <button class="peertube-button orange-button ng-star-inserted" id="add-split-final">Add New Split</button>`;
                        let addFinalButton = document.getElementById("add-split-final")
                        if (addFinalButton) {
                            addFinalButton.onclick = async function () {
                                let addApi;
                                let newSplit = document.getElementById("modal-split-value").value;
                                let newName = document.getElementById('modal-split-name').value;
                                let newAddress = document.getElementById("modal-split-address").value;
                                if (newAddress.length == 66) {
                                    let node = newAddress;
                                    newAddress = "custom"
                                    addApi = `/addsplit?video=` +uuidFromUrl + `&split=` + newSplit + `&splitaddress=` + newAddress+'&name='+newName;
                                    addApi = addApi + `&customkeysend=true&node=` + node + ``
                                } else if (newAddress.indexOf("@") > 1) {
                                    addApi = `/addsplit?video=` + uuidFromUrl + `&split=` + newSplit + `&splitaddress=` + newAddress+'&name='+newName;;
                                } else {
                                    console.log("unable to add malformed split address", newAddress);
                                    notifier.error("Lightning address is neither an address or a valid server pubkey");
                                    return;
                                }
                                let addResult;
                                console.log("attempting add split for video", addApi);
                                try {
                                    addResult = await axios.get(basePath + addApi);
                                } catch (e) {
                                    console.log("unable to add split for video\n", addApi);
                                    notifier.error(e);
                                    return;
                                }
                                if (addResult) {
                                    await closeModal();
                                    notifier.success("split added to " + uuidFromUrl);
                                    await addPanel(await makePanelHtml(await getSplit()));
                                    return;
                                } else {
                                    await closeModal();
                                    notifier.error("failed to add split to " + uuidFromUrl);
                                    return;
                                }    
                            }
                        }
                    }
                }
                for (var slot in splitInfo) {
                    console.log("iterating slot",slot)
                    var editButton = document.getElementById("edit-" + slot);
                    if (editButton) {
                        console.log("setting up edit button",slot)
                        editButton.onclick = async function () {
                            let editSlot = this.slot;
                            console.log("edit slot", editSlot);
                            await peertubeHelpers.showModal({
                                title: 'edit Split for ' + splitInfo[editSlot].address,
                                content: ` `,
                                close: true,
                                confirm: { value: 'X', id: 'streamingsatsclose', action: () => { } },
                            });
                            let ks = splitInfo[slot].customKeysend
                            if (ks == undefined) {
                                ks = false;
                            }
                            let html = await makeKeysendHtml(splitInfo, editSlot, ks);
                            let modal = (document.getElementsByClassName('modal-body'))
                            modal[0].setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
                            modal[0].innerHTML = html;
                            await editButtons(splitInfo,editSlot,ks);
                        }
                    }
                }
            }
            async function getSplit(){
                const basePath = await peertubeHelpers.getBaseRouterRoute();
                let uuidFromUrl = (window.location.href).split("/").pop();
                let splitApi = basePath + "/getsplit?video="+uuidFromUrl;
                let splitData;
                try {
                    splitData = await axios.get(splitApi);
                } catch (err){
                    console.log("client unable to fetch split data\n", splitApi,err);
                    return;
                }
                console.log("got split info",splitData,splitApi);
                return splitData.data;
            }
        }

    })
}
export {
    register
}

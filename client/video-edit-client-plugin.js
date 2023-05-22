import axios from 'axios';
function register({ registerHook, peertubeHelpers }) {
    registerHook({
        target: 'action:video-edit.init',
        handler: async ({ video }) => {
            const { notifier } = peertubeHelpers
            const basePath = await peertubeHelpers.getBaseRouterRoute();
            console.log("video edit",video);
            let uuidFromUrl = (window.location.href).split("/").pop();
            let splitApi = basePath + "/getsplit?video="+uuidFromUrl;
            let splitData;
            try {
                splitData = await axios.get(splitApi);
            } catch (err){
                console.log("client unable to fetch split data\n", splitApi,err);
                return;
            }
            if (!splitData){
                console.log("no split info at video level");
                return;
            }
            let splitInfo = splitData.data;
            console.log("split info",splitInfo);
            let html = `<br><label _ngcontent-msy-c247="" for="Wallet">Episode Splits</label>`
            if (splitInfo && splitInfo.length > 0) {
                html = html + "<table><th>Split %</th><th><center>Lighting Address</center></th><th>Address Type</th></tr>";
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
            const panel = document.createElement('div');
            panel.setAttribute('class', 'lightning-button');
            panel.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
            panel.innerHTML = html;
            console.log("html",html);
            let countnap=0;
            let spot = document.getElementById("ngb-nav-0-panel");
            while (!spot && countnap<100){
                countnap+=5;
                spot = document.getElementById("ngb-nav-"+countnap+"-panel");
            }
            console.log("spot info",spot);
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
                                return;
                            } else {
                                await closeModal();
                                notifier.error("failed to add split to " + uuidFromUrl);
                                return;
                            }    
                        }
                    }
                }
                for (var slot in splitData) {
                    var editButton = document.getElementById("edit-" + slot);
                    if (editButton) {
                        editButton.onclick = async function () {
                            let editSlot = this.slot;
                            await peertubeHelpers.showModal({
                                title: 'edit Split for ' + splitData[editSlot].address,
                                content: ` `,
                                close: true,
                                confirm: { value: 'X', id: 'streamingsatsclose', action: () => { } },
                            });
                            let ks = splitData[slot].customKeysend
                            if (ks == undefined) {
                                ks = false;
                            }
                            let html = await makeKeysendHtml(splitData, editSlot, ks);
                            let modal = (document.getElementsByClassName('modal-body'))
                            modal[0].setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
                            modal[0].innerHTML = html;
                            //await assignSplitEditButtons(splitData, editSlot, channel, ks);
                        }
                    }
                }
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
        }

    })
}
export {
    register
}

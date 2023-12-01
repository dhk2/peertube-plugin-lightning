import axios from 'axios';

import QRious from 'qrious';
import JSConfetti from 'js-confetti'
import { debug } from 'debug/src/browser';
//import tsParticles from 'tsParticles'
//import QRCode from 'qrcode';
//var qrcode = new QRCode("qrcode");
async function register({ registerHook, peertubeHelpers, registerVideoField, registerClientRoute }) {
  const { notifier } = peertubeHelpers
  const basePath = await peertubeHelpers.getBaseRouterRoute();
  const jsConfetti = new JSConfetti()
  const milliday = 24*60*60*1000;
  let tipVerb = "tip";
  let keysendEnabled, lnurlEnabled, legacyEnabled, debugEnabled, rssEnabled;
  let v4vSettings;
  let streamAmount = 69;
  let boostAmount = 69;   
  let lastTip = 69;
  let convertRate;
  let userName = "PeerTuber";
  let boostFrom = userName;
  let walletAuthorized = false;
  let accountName, channelName, videoName, instanceName, accountAddress, softwareVersion, client_id, channelId,videoUuid;
  let streamEnabled = false;
  let menuTimer, streamTimer, wallet, currentTime;
  let panelHack;
  let hostPath;
  let authorizationChecked = false;
  var streamButton;
  let remoteSplitBlock;
  let boostData = new Set;
  let boostSettings={ in: true,
                      out: false,
                      boost: true,
                      auto: false,
                      stream: false};
  let boostPage=1;
  registerHook({
    target: 'action:auth-user.information-loaded',
    handler: async ({ user }) => {
      let authorized;
      if (user) {
        if (debugEnabled) {
          console.log("⚡️user", user);
        }
        userName = user.username
        hostPath = user.account.host;
        let accountWalletApi = basePath + "/walletinfo?account=" + user.username;
        if (debugEnabled) {
          console.log("⚡️wallet api call", accountWalletApi, user.username);
        }
        var accountWallet;
        try {
          authorizationChecked = true;
          accountWallet = await axios.get(accountWalletApi);
        } catch (err) {
          console.log("⚡️no wallet data", err);
        }
        if (accountWallet && accountWallet.data) {
          accountAddress = accountWallet.data.address;
          let authorizedWalletApi = basePath + "/checkauthorizedwallet";
          let headers = { headers: await peertubeHelpers.getAuthHeader() }
          
          try {
            authorized = await axios.get(authorizedWalletApi, headers);
          } catch {
            console.log ("error attempting to verify wallet authorization",authorizedWalletApi);
          }
          if (authorized && authorized.data) {
            walletAuthorized = true;
          } else {
            walletAuthorized = false;
          }
        } 
        if (debugEnabled) {
          // authorized undefined errors
         //console.log(`⚡️ ${user.username} account wallet info, account address:${accountAddress} authorized:${authorized.data} v4v:${v4vSettings}`);
        }
      }
    }
  })
  registerHook({
    target: 'action:video-watch.player.loaded',
    handler: async ({ player, video }) => {
      if (debugEnabled){
        console.log(`⚡️⚡️ video`,video);
      }
      
      let buttonBlock = document.getElementsByClassName('tip-buttons-block');
      if (buttonBlock.length > 0) {
        buttonBlock[0].remove();
      }
      if (streamTimer) {
        clearInterval(streamTimer);
      }
      let videoEl;
      if (player.el()) {
        videoEl = player.el().getElementsByTagName('video')[0]
        if (debugEnabled){
          console.log(`⚡️⚡️videoEl`,videoEl);
        }
      } else {
        //weird error condition avoidance
        videoEl - { time: 0 };
      }
      if (location.instance != video.originInstanceHost) {
        instanceName = video.originInstanceHost;
      }
      if (video.isLive){
        videoUuid = video.uuid+'_'+video.publishedAt.toISOString();
      } else {
        videoUuid = video.uuid;
      }
      remoteSplitBlock = undefined;
      let remoteBlockApi = basePath +`/getsplitkitblock?video=${videoUuid}&instance=${instanceName}`;
      try {
        remoteSplitBlock = await axios.get(remoteBlockApi);
      } catch (e) {
        console.log("⚡️unable to load remote block\n", remoteBlockApi,e);
      }
      if (remoteSplitBlock){
        remoteSplitBlock = remoteSplitBlock.data
        if (debugEnabled){
          console.log("⚡️remote block\n", remoteSplitBlock.data);
        }
      }
      channelId=video.channel.id;
      accountName = video.byAccount;
      channelName = video.byVideoChannel;
      videoName = video.uuid;
      let episodeName = video.name;
      let itemID;
      let episodeGuid = videoUuid;
      let displayName = video.channel.displayName;
      let addSpot = document.getElementById('plugin-placeholder-player-next');
      let addSpot4 = document.getElementsByClassName('root-header-right')[0];
      const elem = document.createElement('div');
      elem.className = 'tip-buttons-block';
      let text = video.support + ' ' + video.channel.support + ' ' + video.channel.description + ' ' + video.account.description + ' ' + video.description;
      text = text.split("\n").join(" ");
      var regex = /\b(https?:\/\/.*?\.[a-z]{2,4}\/[^\s]*\b)/g;
      var result = null;
      if (regex.test(text)) {
        result = text.match(regex);
      }
      var tipeeeLink, streamlabsLink;
      var donationalertsLink, kofiLink, donatestreamLink;
      var buttonHTML = "";
      if (result && legacyEnabled) {
        for (var url of result) {
          if ((url.indexOf("tipeeestream.com") > 0) && (buttonHTML.indexOf("tipeee") <= 0)) {
            tipeeeLink = url;
            //buttonHTML = buttonHTML + ` <button _ngcontent-vww-c178="" type="button" title="tipeee" id = "tipeee" class="peertube-button orange-button ng-star-inserted"><span _ngcontent-vww-c178="" class="ng-star-inserted">💲Tipeee<!----><!----><!----></span><!----><!----></button>`
            buttonHTML = buttonHTML + ` <button title="tipeee pop up fiat payment" id = "tipeee" class="action-button">💲Tipeee</button>`
          }
          if ((url.indexOf("streamlabs.com") > 0 && url.indexOf("streamlabs.com")<10) && (buttonHTML.indexOf("streamlabs") <= 0)) {
            console.log("streamlabs links",url);
            streamlabsLink = url;
            buttonHTML = buttonHTML + ` <button id="streamlabs" class="action-button">💲Streamlabs</button>`
          }
          if ((url.indexOf("streamlabs.com") > 0 && url.indexOf("streamlabs.com")>9) && (buttonHTML.indexOf("streamlabs") <= 0)) {
            url = `https://`+ url.substring(url.indexOf("streamlabs.com"));
            console.log("streamlabs links",url);
            streamlabsLink = url;
            buttonHTML = buttonHTML + ` <button id="streamlabs" class="action-button">💲Streamlabs</button>`
          }
          if ((url.indexOf("donationalerts.com") > 0) && (buttonHTML.indexOf("donationalerts") <= 0)) {
            donationalertsLink = url;
            buttonHTML = buttonHTML + ` <a display:none id = "donationalerts" class="action-button" title="donationalerts">💲Donation Alerts</a>`
          }
          if ((url.indexOf("donate.stream") > 0) && (buttonHTML.indexOf("donatestream") <= 0)) {
            donatestreamLink = url;
            buttonHTML = buttonHTML + ` <a display:none id = "donatestream" class="action-button" title="donatestream">💲donation.stream</a>`
          }
          if ((url.indexOf("ko-fi.com") > 0) && (buttonHTML.indexOf("kofi") <= 0)) {
            kofiLink = url + "#checkoutModal";
            buttonHTML = buttonHTML + ` <a display:none id = "kofi" class="action-button" title="kofi">💲Ko-Fi</a>`
          }
        }
      }

      let splitData = await getSplit();
      var streamButtonText, v4vButtonHTML;
      if (!document.querySelector('.lightning-buttons-block')) {
        if (streamEnabled) {
          streamButtonText = "⚡️" + streamAmount + "/min";
        } else {
          let hack = document.getElementById("stream");
          if (hack){
            hack.remove();
          }
        }
        //buttonHTML = buttonHTML + ` <button _ngcontent-vww-c178="" id = "boostagram" type="button" class="peertube-button orange-button ng-star-inserted">⚡️` + tipVerb + `</button>`
        v4vButtonHTML = ` <button _ngcontent-vww-c178="" id = "stream" type="button" class="peertube-button orange-button ng-star-inserted" title="Pause streaming">` + streamButtonText + `</button>`
        let delta = 0;
        let lastStream;
        if (videoEl){
          lastStream = videoEl.currentTime;
        }
        streamTimer = setInterval(async function () {
          if (videoEl){
            currentTime = videoEl.currentTime;
          }
          if (streamEnabled && splitData) {
            delta = (currentTime - lastStream).toFixed();
            if (debugEnabled) {
              console.log("⚡️counting for stream payments", delta);
            }
            if (delta > 60 && delta < 64) {
              lastStream = currentTime;
              delta = 0;
              let weblnSupported;
              weblnSupported = checkWebLnSupport();
              if (debugEnabled) {
                console.log("⚡️webln support for streaming", weblnSupported, delta, lastStream, currentTime, lastStream - currentTime);
              }
              if (weblnSupported < 2) {
                await alertUnsupported();
                streamEnabled = false;
               /*
                let modalChecker = document.getElementById("v4v-stream-auto");
                if (modalChecker) {
                  modalChecker.checked = false;
                }
                let menuChecker = document.getElementById("streamsats");
                if (menuChecker) {
                  menuChecker.checked = false;
                }
               */
                return;
              }
              let finalSplit;
              splitData=await getSplit();
              if (debugEnabled){
                console.log("split block at start",splitData)
              }
              if (remoteSplitBlock){
                for (var block of remoteSplitBlock.blocks){
                  if (block){
                    //console.log("block",block.settings,block.startTime,block.duration );
                    let blockStart = block.startTime;
                    let blockEnd = blockStart+block.duration;
                    //console.log("barf",blockStart,blockEnd, currentTime)
                    if (blockStart<currentTime && (blockEnd > currentTime)){
                      console.log("Remote block active!",block);
                      finalSplit = await calculateSplit(splitData,block.value.destinations, block.settings.split);
                     // console.log("final split",finalSplit);
                    }
                    if (finalSplit){
                      splitData=finalSplit;
                     // console.log("whats wriong with remoteSplitBlock",remoteSplitBlock);
                      splitData[0].title = block.title;
                      splitData[0].image = block.image;
                      splitData[0].itemguid = block.itemGuid;
                      splitData[0].feedguid = block.feedGuid;
                      //console.log("primary split",splitData[0])
                    }
                  }
                }

              }
              if (debugEnabled){
                console.log("split block at end",splitData)
              }
              let remoteFeed = splitData[0].feedguid;
              let remoteItem = splitData[0].itemguid;
              for (var wallet of splitData) {
                var amount = streamAmount * (wallet.split / 100);
                let result;
                if ((wallet.keysend && keysendEnabled) || walletAuthorized) {
 //                 result = await boost(wallet.keysend, amount, null, boostFrom, video.channel.displayName, video.name, "stream", video.uuid, video.channel.name + "@" + video.channel.host, video.channel.name, null, streamAmount, wallet.name, accountAddress,remoteFeed,remoteItem);
                  result = await boost(wallet.keysend,amount,"Streaming",userName,video.channel.dispayName,video.name,"stream",video.uuid,undefined,streamAmount,wallet.name,accountAddress,remoteFeed,remoteItem)
                } else if (wallet.lnurl && lnurlEnabled) {
                  result = await sendSats(wallet.lnurl, amount, "Streaming Sats", boostFrom);
                  //walletData = await refreshWalletInfo(walletData.address);
                }
                if (debugEnabled) {
                  console.log("⚡️boosting " + wallet.address + " tried to send " + amount + " ended up with " + result);
                }
              }
              lastStream = currentTime;
            }
            if (delta > 63 || delta < 0) {
              lastStream = currentTime;
            }
          }
        }, 1000);
      }
      if (v4vButtonHTML && streamEnabled) {
        //  console.log("⚡️--------------button hmtl",v4vButtonHTML)
        elem.innerHTML = v4vButtonHTML;
        addSpot4.appendChild(elem);

      }
      if (splitData) {
        let addSpot2Find = document.getElementsByClassName("video-actions");
        //("second add spot", addSpot2Find);
        let addSpot2 = addSpot2Find[0];
        let addSpot3Find = document.getElementsByClassName("action-button")
        let addSpot3 = addSpot3Find[2];
        const transparentButton = document.createElement('button');
        transparentButton.innerHTML = "⚡️" + tipVerb;
        transparentButton.class = "action-button action-button-zap";
        transparentButton.className = "action-button action-button-zap";
        transparentButton.ariaPressed = "false";
        transparentButton.title = "Send Sats to " + channelName;
        transparentButton.id = "boostagram"
        let fiatButtons = document.createElement('span');
        fiatButtons.innerHTML = buttonHTML;
        addSpot2.insertBefore(transparentButton, addSpot3);
        //let hackspot = document.getElementById("boostagram")
        addSpot2.insertBefore(fiatButtons, addSpot3);
        buttonHTML = undefined;
      }
      if (buttonHTML) {
        let addSpot2Find = document.getElementsByClassName("video-actions");
        let addSpot2 = addSpot2Find[0];
        let addSpot3Find = document.getElementsByClassName("action-button")
        let addSpot3 = addSpot3Find[2];
        let fiatButtons = document.createElement('span');
        fiatButtons.innerHTML = buttonHTML;
        addSpot2.insertBefore(fiatButtons, addSpot3);
      }
      const boostButton = document.getElementById("boostagram");
      if (boostButton) {
        document.getElementById("boostagram").onclick = async function () {
          splitData = await getSplit(true);
          let title = displayName;
          if (splitData && splitData[0] &&splitData[0].title){
            title= splitData[0].title;
          }
          await peertubeHelpers.showModal({
            title: 'Support ' + title,
            content: ` `,
            close: true,
            // confirm: { value: 'X', action: () => { } },
          })
          splitData = await makeTipDialog(displayName, splitData);
          let tipButton = document.getElementById('modal-satbutton');
          let oldValue;
          if (tipButton) {
            tipButton.onclick = async function () {
              oldValue = tipButton.textContent;
              tipButton.textContent = "Boosting...";
              await buildTip(splitData, displayName, episodeName, episodeGuid, itemID);
              tipButton.textContent = oldValue
            }
          }
        }
      }

      const streamlabsButton = document.getElementById("streamlabs")
      if (streamlabsButton) {
        streamlabsButton.onclick = async function () {
          var connectButtons = document.getElementsByClassName("u-button");
          window.open(streamlabsLink, 'popup', 'width=600,height=800');
        }
      }
      const tipeeeButton = document.getElementById("tipeee")
      if (tipeeeButton) {
        tipeeeButton.onclick = async function () {
          window.open(tipeeeLink, 'popup', 'width=1100,height=700');
        }
      }
      let videoDisplay = document.getElementById("videojs-wrapper");
      let fullVideo = document.getElementById("video-wrapper");
      var oldVideo

      const donationalertsButton = document.getElementById("donationalerts")
      if (donationalertsButton) {
        donationalertsButton.onclick = async function () {
          window.open(donationalertsLink, 'popup', 'width=600,height=800');
        }
      }
      const donatestreamButton = document.getElementById("donatestream")
      if (donatestreamButton) {
        donatestreamButton.onclick = async function () {
          window.open(donatestreamLink, 'popup', 'width=600,height=800');
        }
      }
      const kofiButton = document.getElementById("kofi")
      if (kofiButton) {
        kofiButton.onclick = async function () {
          window.open(kofiLink, 'popup', 'width=600,height=800');
        }
      }

    }
  })
  registerHook({
    target: 'action:video-channel-videos.video-channel.loaded',
    handler: async (result, params) => {
      if (debugEnabled) {
        console.log("⚡️ chanel loaded result ", result,"params:", params)
      }
      if (document.getElementById("patronize-channel")){
        return;
      }
      let buttonSpot= document.getElementsByClassName("channel-buttons");
      let buttonHtml = document.createElement("div");
      let subscribed,subApi;
      let channel = result.videoChannel.nameWithHostForced
      try {
        subApi=basePath + `/getsubscriptions?channel=${channel}&user=${userName}`;
        if (debugEnabled){
          console.log("trying to get subscription",channel, subApi);
        }
        subscribed = await axios.get( subApi, { headers: await peertubeHelpers.getAuthHeader() });
        if (debugEnabled){
          console.log("subscription result",channel, subscribed);
        }
        if (subscribed && subscribed.data && subscribed.data !="" && subscribed.data[0] && subscribed.data[0].user) {
          //console.log("⚡️subscribed ",subscribed.data);
          let pend = subscribed.data[0].pendingconfetti;
          if (pend>0){
            doConfetti(pend*69)
            notifier.success(`patronized for ${pend} days of ${subscribed.data[0].paiddays}`)
            let ccApi=basePath + `/clearconfetti?channel=${result.videoChannel.nameWithHostForced}&user=${userName}`;
            //console.log("trying to clear confetti pending",ccApi);
            await axios.get( ccApi, { headers: await peertubeHelpers.getAuthHeader() });
          }
        } else {
          console.log("⚡️didn't get good subscription data",subscribed);
        }
        //console.log("subscription result",subscribed,subscribed.data,buttonHtml.innerHTML);
      } catch (err) {
         console.log("⚡️error attempting to get subscribed status", subApi, err);
      }
      buttonHtml.innerHTML=`<button id='manage-patronize-channel' class="peertube-button-link orange-button ng-star-inserted">Manage Patronage</button>`;
      buttonSpot[0].appendChild(buttonHtml);
      let subscribeButton = document.getElementById("patronize-channel");
      
      let manageButton = document.getElementById("manage-patronize-channel");
      if (manageButton) {
        manageButton.onclick = async function () {
          await peertubeHelpers.showModal({
            title: 'Configure Patronage for ' + channel,
            content: ` `,
            close: true,
            confirm: { value: 'X', action: () => { } },

          })
          let suggestedAmount, patronName, replyAddress, updateButtonText;
          updateButtonText = "Patronize";
          if (subscribed && subscribed.data && subscribed.data[0]){
            suggestedAmount = subscribed.data[0].amount;
            updateButtonText = "Update Patronage"
            patronName= subscribed.data[0].name;
            replyAddress = subscribed.data[0].address
          } else if (v4vSettings) {
            patronName = v4vSettings.boostFrom;
            replyAddress = v4vSettings.boostBack
          } else {
            patronName="";
            replyAddress ="";
          }
          if (!suggestedAmount){
            suggestedAmount = "69";
          }
          let modal = (document.getElementsByClassName('modal-body'))
          modal[0].setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
          modal[0].innerHTML = await getTimePeriodsHtml()+`<br>`+await getPatronLevels(channel)+`<br><label for="amount">Daily Patronage:</label><input class="form-control d-block ng-pristine ng-valid ng-touched"  type="number" id="modal-patronage-amount" value="${suggestedAmount}"><br>
          <input type="checkbox" id="modal-patronage-private" name="private-patron"> <label for="private">Anonymous Patronage:</label><br>
          <label for="name">Patron Name:</label><input class="form-control d-block ng-pristine ng-valid ng-touched"  type="text" id="modal-patronage-name" value="${patronName}"><br>          <label for="address">Boost Back Address:</label><input class="form-control d-block ng-pristine ng-valid ng-touched" type="text" id="modal-patronage-address" value="${replyAddress}"><br>
          <button class="peertube-button orange-button ng-star-inserted" id="modal-patronage-update">${updateButtonText}</button>
          <button id='modal-patronage-depatronize' class="peertube-button-link orange-button ng-star-inserted"'>De-Patronize</button>`;
          //console.log("yeah",wallet);
          let managedFrequency =  document.getElementById("times");
          let managedLevel =  document.getElementById("patron-level");
          let managedAmount =  document.getElementById("modal-patronage-amount");
          let managedName =  document.getElementById("modal-patronage-name");
          let managedAddress =  document.getElementById("modal-patronage-address");
          let managedPrivate =  document.getElementById("modal-patronage-private");
          let unsubscribeButton = document.getElementById("modal-patronage-depatronize");
          let updateButton = document.getElementById("modal-patronage-update")
          if (updateButtonText == "Patronize"){
            unsubscribeButton.style.visibility="hidden";
          }
          if (managedPrivate){
            managedPrivate.onchange = async function(){
              if (managedPrivate.checked){
                managedName.disabled=true;
                managedAddress.disabled=true;
              } else {
                managedName.disabled=false;
                managedAddress.disabled=false;              
              }
            }
            if (managedPrivate.checked){
              managedName.disabled=true;
              managedAddress.disabled=true;
            }
            if (subscribed && subscribed.data && subscribed.data[0]){
              managedFrequency.value = subscribed.data[0].type;
              managedLevel.value = subscribed.data[0].amount;
            }
          }
          managedLevel.onchange = async function() {
            managedAmount.value = managedLevel.value;
          }
          unsubscribeButton.onclick = async function () {
            console.log("!! un~subscribo !!");
            try {
              closeModal();
              subApi=`${basePath}/deletesubscription?user=${userName}&channel=${result.videoChannel.nameWithHostForced}`;
              if (debugEnabled){
                console.log("⚡️attempting to delete subscription",subApi)
              }
              await axios.get( subApi, { headers: await peertubeHelpers.getAuthHeader() });
              console.log("⚡️unsubscribed");
              //subscribeButton.style.visibility="visible";
              //manageButton.style.visibility="hidden";
              manageButton.innerText="Patronize"
            } catch (err) {
              console.log("⚡️error attempting to unsubscribe", subApi, err);
              //subscribeButton.style.visibility="hidden";
            }
          }
          updateButton.onclick = async function () {
            console.log("patronizing",subscribed)
            let newSub,updateApi;
            if (subscribed && subscribed.data && subscribed.data[0]) {
              newSub = subscribed.data[0];
              updateApi = basePath + `/updatesubscription?channel=` + channel;
            } else {
              newSub = {};
              updateApi = basePath + `/createsubscription?channel=` + channel;
            }
            if (debugEnabled){
              console.log("⚡️old subscription", userName,channel,newSub);
            }
            let newAmount = managedAmount.value;
            if (typeof newAmount == 'string'){
              newAmount = Number(newAmount);
            }
            if (newAmount !=newSub.amount){
              newSub.amount = newAmount;
            }
            if (newSub.channel !=channel){
              newSub.channel=channel;
            }
            if (managedFrequency.value != newSub.type){
              newSub.type = managedFrequency.value;
            }
            if (managedName.value !=newSub.name){
              newSub.name = managedName.value;
            }
            if (managedAddress.value !=newSub.address){
              newSub.address = managedAddress.value;
            }
            if (managedPrivate.checked == newSub.public){
              newSub.public = !newSub.public;
            }
            if (debugEnabled){
              console.log("⚡️new subscription", userName,channel,newSub);
            }
            console.log("⚡️⚡️checking new patronage",newSub);
            let updateResult;
            try {
              updateResult = await axios.post(updateApi, newSub,{ headers: await peertubeHelpers.getAuthHeader() });
              doConfetti();
              manageButton.innerText="Manage Patronage"
            } catch (e) {
              console.log("⚡️unable to update patronage\n", updateApi, e);
              notifier.error(e, updateApi);
              return;
            }
            closeModal();
          }

        }
        if (subscribed && subscribed.data && subscribed.data !="" && subscribed.data[0] && subscribed.data[0].user) {
          manageButton.style.visibility="visible";
          manageButton.innerText="Manage Patronage"
        } else {
          manageButton.innerText="Patronize"
          manageButton.style.visibility="visible";
        }
      }
      if (subscribeButton){
        subscribeButton.onclick = async function () {
          subscribeButton.innerHTML="patronizing";
          console.log("!! subscribo !!");
          let body={
            user: userName,
            channel: result.videoChannel.nameWithHostForced,
            type: 'Daily',
          }
          let subscribed;
          try {
            subApi=basePath + `/createsubscription`
            subscribed = await axios.post( subApi, body, { headers: await peertubeHelpers.getAuthHeader() });
            //console.log("initial subscribed",subscribed);
            if (subscribed && subscribed.data) {
              //console.log("⚡️subscribe ",subscribed.data[0]);
              subscribeButton.innerHTML="Patronize";
              subscribeButton.style.visibility="hidden";
              manageButton.style.visibility="visible";
              doConfetti(69);
              notifier.success(`Automatic patron support for ${result.videoChannel.name} enabled`)
            } else {
              console.log("⚡️ unable to subscribe",subscribed,body);
            }
          } catch (err) {
            console.log("⚡️error attempting to subscribe", subApi, err);
            if (err && err.response && err.response.data){
              notifier.error(err.response.data);
            } else {
              notifier.error("unable to create subscription");
            }
          }
          subscribeButton.innerHTML="Patronize";
        }
        if (subscribed && subscribed.data && subscribed.data !="" && subscribed.data[0] && subscribed.data[0].user) {
          subscribeButton.style.visibility="hidden";
        } else {
          subscribeButton.style.visibility="hidden";
        }
      }
      return result;
    }
  })
 registerHook({
    target: 'filter:left-menu.links.create.result',
    handler: async (links) => {
      console.log("⚡️ links",links);
      if (!peertubeHelpers.isLoggedIn()) {
        return links;
      }
      if (!Array.isArray(links)) {
        return links;
      }
      links[0].links.push({
        "label": "Value 4 Value",
        "shortLabel": "V4V",
        "path": '/p/lightning/settings',
        "icon": 'syndication'
      })
      return links;
    }
  })
  registerClientRoute({
    route: 'lightning/settings',
    onMount: async ({ rootEl }) => {
      let v4vPanel = await makeValueSettings();
      rootEl.innerHTML = v4vPanel
      let modalSatStream = document.getElementById("v4v-stream-amount");
      let modalCashStream = document.getElementById("v4v-stream-cash");
      let modalSatBoost = document.getElementById("v4v-def-boost-amount");
      let modalCashBoost = document.getElementById("v4v-def-boost-cash");
      let menuStreamAmount = document.getElementById('streamamount');
      let v4vSettingsUpdate = document.getElementById('v4v-settings-update');
      let userAddress = document.getElementById('v4v-boost-back');
      let v4vBoostAmount = document.getElementById('v4v-def-boost-amount');
      let v4vStreamAuto = document.getElementById('v4v-stream-auto');
      let v4vBoostName = document.getElementById('v4v-boost-name');
      let modalAddressAuthorize = document.getElementById("v4v-wallet-authorize");
      let v4vGetBoosts = document.getElementById('v4v-show-boosts')
      let modalChecker = document.getElementById("v4v-stream-auto");
      let boostIn = document.getElementById("v4v-invoice-in");
      let boostOut = document.getElementById("v4v-invoice-out");
      let boostBoost = document.getElementById("v4v-invoice-boost");
      let boostStream = document.getElementById("v4v-invoice-stream");
      let boostAuto = document.getElementById("v4v-invoice-auto");
      boostBoost.checked=true;
      boostIn.checked=true;
      async function activateHtml(){
        modalSatStream = document.getElementById("v4v-stream-amount");
        modalCashStream = document.getElementById("v4v-stream-cash");
        modalSatBoost = document.getElementById("v4v-def-boost-amount");
        modalCashBoost = document.getElementById("v4v-def-boost-cash");
        menuStreamAmount = document.getElementById('streamamount');
        v4vSettingsUpdate = document.getElementById('v4v-settings-update');
        userAddress = document.getElementById('v4v-boost-back');
        v4vBoostAmount = document.getElementById('v4v-def-boost-amount');
        v4vStreamAuto = document.getElementById('v4v-stream-auto');
        v4vBoostName = document.getElementById('v4v-boost-name');
        modalAddressAuthorize = document.getElementById("v4v-wallet-authorize");
        v4vGetBoosts = document.getElementById('v4v-show-boosts')
        modalChecker = document.getElementById("v4v-stream-auto");
        boostIn = document.getElementById("v4v-invoice-in");
        boostOut = document.getElementById("v4v-invoice-out");
        boostBoost = document.getElementById("v4v-invoice-boost");
        boostStream = document.getElementById("v4v-invoice-stream");
        boostAuto = document.getElementById("v4v-invoice-auto");
        //console.log("-----",wallet);
        if (modalAddressAuthorize) {
          let authorizedWalletApi = basePath + "/checkauthorizedwallet";
          //console.log("⚡️authorized wallet api:",authorizedWalletApi);
          let headers = { headers: await peertubeHelpers.getAuthHeader() }
          //console.log("⚡️headers",headers)
          let authorized;
          try {
            authorized = await axios.get(authorizedWalletApi, headers);
            walletAuthorized = true;
            //console.log("----",authorized);
          } catch (e){
            console.log("⚡️unable to confirm authorized",authorized,e);
            walletAuthorized = false;
          }
          //console.log("⚡️authorized result",authorized);
          let newUserAddress = userAddress.value;
          //console.log("⚡️wallet authorized",walletAuthorized,"newAddress",newUserAddress,"button",modalAddressAuthorize);
          modalAddressAuthorize.style.visible = false;
          if (client_id && peertubeHelpers.isLoggedIn()) {
            modalAddressAuthorize.style.visible = true;
            if (!walletAuthorized) {
              modalAddressAuthorize.textContent = "Authorize"
            } else {
              modalAddressAuthorize.textContent = "De-Authorize";
            }
            modalAddressAuthorize.onclick = async function () {
              if (debugEnabled) {
                console.log("⚡️authorize button clicked", walletAuthorized);
              }
              
              if (walletAuthorized) {
                try {
                  await axios.get(basePath + "/setauthorizedwallet?clear=true", { headers: await peertubeHelpers.getAuthHeader() });
                  notifier.success("De-Authorized getalby wallet");
                  walletAuthorized = false;
                  modalAddressAuthorize.textContent="Authorize";
                } catch {
                  notifier.error("error trying to deauthorize wallet")
                }
                return;
              }
              let authorizeReturned;
              let authorizationUrl = basePath + "/setauthorizedwallet?address=" + userAddress.value
              let headers = { headers: await peertubeHelpers.getAuthHeader() }
              if (debugEnabled) {
                console.log("attempting to authorize", authorizationUrl, headers);
              }
              try {
                authorizeReturned = await axios.get(authorizationUrl, headers);
              } catch (err) {
                notifier.error("error trying to inform peertube of incoming authorization");
                console.log("error with authorization", err, authorizationUrl, headers);
              }
              let parts = basePath.split("/");
              let callbackPath = "https://" + hostPath + "/" + parts[1] + "/" + parts[2] + "/" + parts[4] + "/callback";

              let albyUrl = `https://getalby.com/oauth?client_id=` + client_id + `&response_type=code&redirect_uri=` + callbackPath + `&scope=account:read%20invoices:create%20invoices:read%20payments:send%20transactions:read&state=` + userName;
              if (debugEnabled) {
                console.log("callback", callbackPath, "\n alby url", albyUrl);
              }
              window.open(albyUrl, 'popup', 'width=600,height=800');
              modalAddressAuthorize.textContent="De-Authorize";
            }
          }
        } else if (debugEnabled) {
          console.log("⚡️no authorize button");
        }
        if (v4vSettings && v4vStreamAuto){
          v4vStreamAuto.checked = v4vSettings.streamAuto;
        }
        if (v4vGetBoosts){
          v4vGetBoosts.onclick = async function () {
            v4vGetBoosts.textContent="Getting...";
            let getBoostApi = basePath + `/getboosts?page=${boostPage}`;
            boostPage++;
            if (boostIn.checked){
              getBoostApi=getBoostApi+`&in=true`;
            }
            if (boostOut.checked){
              getBoostApi=getBoostApi+`&out=true`;
            }
            let headers = { headers: await peertubeHelpers.getAuthHeader() }
            let boosts;
            let tableHtml = `<table>`;
            try {
              boosts = await axios.get(getBoostApi, headers);
              if (boosts && boosts.data){
                console.log(boosts.data,boosts.data.length,boostData.length);
                boostData = [...boostData,...boosts.data];
                console.log("----boosts",boostData.length,boostBoost.checked,boostStream.checked,boostAuto.checked,boostData);
                let lastItem;
                let lastAmount=0;
                let runningTotalSats=0;
                for (var invoice of boostData){
                  if (invoice && invoice.boostagram){
                    let action = invoice.boostagram.action;
                    if ((action == "stream" && !boostStream.checked ) || 
                        (action == "boost" && !boostBoost.checked) ||
                        (action == "auto" && !boostAuto.checked)){
                          continue;
                        }
                    let actionColor = `class="pt-badge badge-blue ng-star-inserted"` ;
                    if (invoice && invoice.boostagram){
                      //console.log(invoice);
                      if (invoice.boostagram.action == 'stream'){
                        actionColor = `class="pt-badge badge-purple ng-star-inserted"`
                      }
                      if (invoice.boostagram.action == 'auto'){
                        actionColor = `class="pt-badge badge-yellow ng-star-inserted"`
                      } 
                      if (invoice.boostagram.action == 'boost'){
                        actionColor = `class="pt-badge badge-green ng-star-inserted"`
                      }
                      console.log("matching",lastItem,invoice.creation_date)  
                      if (Math.abs(lastItem-invoice.creation_date) > 30){
                        tableHtml = tableHtml+`<tr><td colspan="2"><hr></td></tr>`;
                        console.log("boost",runningTotalSats,lastAmount);
                        runningTotalSats = 0;
                        console.log(``)
                        console.log(invoice.boostagram);
                      }
                      let mycash = (invoice.amount * convertRate).toFixed(2);
                      let mysats= invoice.amount;
                      let totalsats = invoice.boostagram.value_msat_total/1000;
                      let totalcash = (totalsats * convertRate).toFixed(2);
                      let splitderived = ((mysats/totalsats)*100).toFixed(2);
                      console.log("figuring",mycash,mysats,totalsats,totalcash,splitderived,"boost",runningTotalSats,lastAmount);
                      let row = `<tr><td ${actionColor}>${totalsats} ($ ${totalcash}) @ ${splitderived}% ${mysats} <b>($ ${mycash}</b> ${action} <td>From:${invoice.boostagram.sender_name} to ${invoice.boostagram.name}</tr>
                                <tr><td colspan="2"><b>${invoice.boostagram.message}</b></td></tr>`
                      tableHtml = tableHtml + row;
                      runningTotalSats = runningTotalSats + mysats;
                      lastAmount = totalsats
                      lastItem = invoice.creation_date;
                      
                    }
                  }
                }
                tableHtml = tableHtml + '</table>';
                rootEl.innerHTML = v4vPanel+tableHtml;
                activateHtml();
                v4vGetBoosts.textContent="Get more Boosts";
              }
            } catch (e){
              console.log("⚡️unable to get boosts",e);
            }
          }
        }
        if (v4vSettingsUpdate) {
          v4vSettingsUpdate.onclick = async function () {
            //let setWalletApi = basePath + "/setwallet?address=" + userAddress.value;
            //console.log("⚡️api call to update user lightningAddress",setWalletApi);
            v4vSettingsUpdate.value = "updating";
            /*
            try {
              let userData = await axios.get(setWalletApi, { headers: await peertubeHelpers.getAuthHeader() });
              if (userData && userData.data) {
                console.log("⚡️user lightning address",userData.data);
                userAddress.value = userData.data.address;
                accountAddress = userData.data.address;
                v4vSettings.boostBack=accountAddress;
                notifier.success("updated " + userName + "'s lighting address to " + accountAddress);
              } else {
                console.log("⚡️didn't get good user address");
                notifier.error("failed to udate " + userName + "'s lighting address to " + userAddress.value);
              }
            } catch (err) {
              console.log("⚡️error attempting to update user wallet", setWalletApi, err);
            }
            */
            let newV4v={
              boostBack: userAddress.value,
              streamAmount: modalSatStream.value,
              streamAuto: v4vStreamAuto.checked,
              boostFrom: v4vBoostName.value,
              boostAmount: v4vBoostAmount.value,
            }
            v4vSettings = newV4v;
            boostAmount = v4vSettings.boostAmount;
            streamAmount = v4vSettings.streamAmount;
            boostFrom = v4vSettings.boostFrom;
            streamEnabled = v4vSettings.streamAuto;
            accountAddress = v4vSettings.boostBack;
            let v4vApi = basePath + "/updatev4v";
            let result;
            try {
              if (debugEnabled){
                console.log("trying to update v4v settings",result,v4vApi);
              }
              result = await axios.post(v4vApi,newV4v,{ headers: await peertubeHelpers.getAuthHeader() })
            } catch (err){
              console.log("⚡️error attempting to update v4v settings", v4vApi, err);
              notifier.error("Unable to update V4V settings");
            }
            notifier.success(result.data)
          }
        }
        if (modalSatStream) {
          modalSatStream.onchange = async function () {
            modalCashStream.value = (modalSatStream.value * convertRate).toFixed(2);
            streamAmount = modalSatStream.value
            if (menuStreamAmount) {
              menuStreamAmount.value = streamAmount;
            }
          }
        }
        if (modalSatBoost) {
          modalSatBoost.onchange = async function () {
            modalCashBoost.value = (modalSatBoost.value * convertRate).toFixed(2);
          }
        }
        if (modalCashStream) {
          modalCashStream.onchange = async function () {
            modalSatStream.value = (modalCashStream.value / convertRate).toFixed();
            streamAmount = modalSatStream.value;
            if (menuStreamAmount) {
              menuStreamAmount.value = streamAmount;
            }
          }
        }
        
        if (modalChecker) {
          if (streamEnabled) {
            modalChecker.checked = true;
          }
          modalChecker.onclick = async function () {
            //let modalChecker = document.getElementById("v4v-stream-auto");
            let menuChecker = document.getElementById("streamsats");
            let butt = document.getElementById("stream");
            var streamButtonText = "";
            if (streamEnabled) {
              streamButtonText = "⚡️" + streamAmount + "/min";
            } else {
              streamButtonText = "⚡️V4V";
            }
            if (butt){
              butt.textContent = streamButtonText;
            }
            if (menuChecker) {
              menuChecker.checked = streamEnabled;
            }
            let currentStreamAmount = document.getElementById('v4v-stream-amount');

            if (currentStreamAmount) {
              streamAmount = parseInt(currentStreamAmount.value);
              if (menuStreamAmount) {
                menuStreamAmount.value = streamAmount;
              }
              let dialog2Element = document.getElementById("streamdialog");
              if (dialog2Element) {
                if (streamEnabled) {
                  dialog2Element.style.display = "block";
                } else {
                  dialog2Element.style.display = "none"
                }
              }
            } else {
              console.log("⚡️really not sure how this error could logically be reached", currentStreamAmount, streamAmount);
            }
          }
        }
      }
      activateHtml();
    }
  })
  registerHook({
    target: 'action:router.navigation-end',
    handler: async ({ params, user }) => {
      if (debugEnabled){
        console.log('⚡️navigation end!', params,user);
      }
      //console.log("⚡️wallet authorized",walletAuthorized,"pod data",podData);
      //console.log("⚡️instance name",instanceName,"host path",hostPath,"account address",accountAddress);
      //console.log("⚡️logged in",await peertubeHelpers.isLoggedIn(),"authorization checked",authorizationChecked);
      if (peertubeHelpers.isLoggedIn() && !authorizationChecked){
        console.log("⚡️may need to load wallet data here ");
      }
      if (!peertubeHelpers.isLoggedIn()){
        console.log("⚡️ user not logged in, clearing  ");
        walletAuthorized=false;
        authorizationChecked=false;
        accountAddress=undefined;
      } else {
        if (!v4vSettings){
          await loadV4vSettings();
        }
      }
      streamButton = document.getElementById("stream");
      let autoplay = document.getElementById("autoplay-next-video");
      if (streamButton) {
        //console.log("stream button found",streamEnabled);
        streamButton.title = "Stream Sats to " + channelName + " every minute of watching";
        if (streamEnabled && autoplay){
          streamButton.style.visibility="visible";
        } else {
          streamButton.remove();
        }
        streamButton.onclick = async function () {
          console.log("streamButton settings",streamEnabled,autoplay);
        }
      } 
    }
  })
  /*
  registerHook({
    target: 'action:video-edit.init',
    handler: async ({ type, updateForm }) => {
      let podData
      let itemTxt = document.getElementById("itemtxt");
      console.log('⚡️type and update form!', type,updateForm,itemTxt);
    }
  })
  */
  registerHook({
    target: 'action:video-channel-update.video-channel.loaded',
    handler: async (params) => {
      if (debugEnabled) {
        console.log("⚡️channel update loaded", params.videoChannel,params.data);
      }
      let fullChannel=params.videoChannel.nameWithHostForced;
      
      videoName = undefined;
      let channelUpdate = document.getElementsByClassName("form-group");
      let channel = (window.location.href).split("/").pop();
      channelName = channel;
      let splitData = await getSplit();
      //let walletInfo = await getWalletInfo(null, null, channel);
      let feedID = await getFeedID(channel);
      let feedGuid = await getChannelGuid(channel);
      let panel = await getConfigPanel(splitData, channel);
      panelHack = panel;
      channelUpdate[0].appendChild(panel);
      let id = document.getElementById("id");
      if (id) {
        id.value = feedID;
        let updateButton = document.getElementById("update-feed");
        if (updateButton) {
          updateButton.onclick = async function () {
            setFeedID(channel, id.value);
            updateButton.innerText = "Saved!";
          }
        }
      }
      let createButton = document.getElementById('create-split');
      if (createButton) {
        createButton.onclick = async function () {
          await peertubeHelpers.showModal({
            title: 'Add Lightning Address for' + channel,
            content: ` `,
            close: true,
            confirm: { value: 'X', action: () => { } },

          })
          let modal = (document.getElementsByClassName('modal-body'))
          //modal[0].setAttribute('class', 'lightning-button');
          modal[0].setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
          modal[0].innerHTML = await getDirectoryHtml()+`<br><label for="name">Display name:</label><input class="form-control d-block ng-pristine ng-valid ng-touched"  type="text" id="modal-split-name"><br>
          Enter a lightning address or a Lightning Node Pubkey <br> <label for="address">Lightning Address:</label><input class="form-control d-block ng-pristine ng-valid ng-touched"  type="text" id="modal-split-address"><br>
          <button class="peertube-button orange-button ng-star-inserted" id="add-split-final">Add Lightning Address</button>`;
          document.getElementById("add-split-final").onclick = async function () {
            let newAddress = document.getElementById("modal-split-address").value;
            let newName = encodeURI(document.getElementById("modal-split-name").value);
            let createApi = basePath + `/createsplit?channel=` + channel + `&splitaddress=` + newAddress + `&name=` + newName;
            let createResult;
            try {
              createResult = await axios.get(createApi);
            } catch (e) {
              console.log("⚡️unable to create split\n", createApi);
              notifier.error("Unable to create split");
              return;
            }
            if (createResult) {
              await closeModal();
              let newPanel = await getConfigPanel(createResult.data, channel);
              let channelUpdate = document.getElementsByClassName("form-group");
              channelUpdate[0].removeChild(panelHack)
              channelUpdate[0].appendChild(newPanel);
              panelHack = newPanel
              await assignEditButtons(createResult.data, channel);
              notifier.success("split create for " + channel);
              splitData = createResult.data
            } else {
              notifier.error("failed to CREATE split to " + channel);
            }
            let newPanel = await getConfigPanel(splitData, channel);
            let channelUpdate = document.getElementsByClassName("form-group");
            channelUpdate[0].removeChild(panelHack)
            channelUpdate[0].appendChild(newPanel);
            panelHack = newPanel;
            await assignEditButtons(splitData, channel);

          }
          let optionBox = document.getElementById("names");
          if (optionBox){
            optionBox.addEventListener('change', async function() {
              if (debugEnabled){
                console.log("⚡️ changed value",this.value);
              }
              document.getElementById("modal-split-name").value = this.value;
              let dude = await getLightningAddress(this.value);
              document.getElementById("modal-split-address").value = dude.address;
            })
          } else {
            if (debugEnabled){
              console.log("⚡️ unable to link optionbox");
            }
          }
        }
      }
      let editLevelButton = document.getElementById('edit-levels');
      if (editLevelButton){
        editLevelButton.onclick = async function () {
          console.log("wtf",channel,channelName,channelId,instanceName,fullChannel);
          await peertubeHelpers.showModal({
            title: 'Edit Patronage levels for ' + channel,
            content: ` `,
            close: true,
            confirm: { value: 'X', action: () => { } },

          })
          let levelsApi = basePath + `/getpatronlevels?channel=${fullChannel}`;
          let levels,levelsData;
          try {
            levelsData = await axios.get(levelsApi);
          } catch(e) {
            console.log ("error getting patron rules for",fullChannel,e)
          }
          
          if (levelsData && levelsData.data){
            console.log("data",levelsData.data);
            levels = levelsData.data;
          } else {
            console.log("loading default levels", )
            levels = await getDefaultPatronLevels();
          }
          console.log("levels",levels)
          let textList ="";
          for (var level of levels){
            textList = textList + `${level.name},${level.sats}\n`
          }
          let modal = (document.getElementsByClassName('modal-body'))
          modal[0].setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
          modal[0].innerHTML = `Patronage levels. patronage level,then comma, then daily sats for that level<br>
          <textarea id="power-levels" name="Power Levels" rows="4" cols="50">${textList}</textarea><br>
          <button class="peertube-button orange-button ng-star-inserted" id="update-levels">update patron levels</button>`;
          let updateLevelsButton = document.getElementById("update-levels");
          if (updateLevelsButton){
            updateLevelsButton.onclick = async function () {
              let newlist = document.getElementById("power-levels");
              console.log(newlist,newlist.innerHTML,newlist.innerText,newlist.value);
              let newLevels = newlist.value.split('\n');
              let newArray =[];
              //console.log("newList",newlist,"newLevels",newLevels,"new array",newArray);
              let powerLevel;
              for (var line of newLevels){
                //console.log("line",line);
                let parts=line.split(',');
                powerLevel ={
                  name: parts[0],
                  sats: parts[1]
                }
                console.log(powerLevel);
                if (powerLevel.sats){
                  newArray.push(powerLevel);
                } 
              }
              let powerLevelApi = basePath + `/setpatronlevels?channel=${fullChannel}`;
              console.log(newArray,powerLevelApi);
              try {
                await axios.post(powerLevelApi,newArray);
              } catch {
                console.log("error updating patron levels",powerLevelApi);
              }
              closeModal();
            }
          }
        }
      }
      assignEditButtons(splitData, channel);
    }
  })
  await peertubeHelpers.getSettings()
    .then(s => {
      tipVerb = s['lightning-tipVerb'];
      keysendEnabled = s['keysend-enable'];
      legacyEnabled = s['legacy-enable'];
      lnurlEnabled = s['lnurl-enable'];
      debugEnabled = s['debug-enable'];
      rssEnabled = s['rss-enable'];
      client_id = s['alby-client-id'];
      // if (debugEnabled) {
      console.log("⚡️settings", s);
      // }
    })
  try {
    let conversionData = await axios.get("https://api.coincap.io/v2/rates/bitcoin")
    if (conversionData.data.data.rateUsd) {
      convertRate = conversionData.data.data.rateUsd / 100000000
    }
  } catch {
    console.log("⚡️error getting conversion rate. Falling back to", convertRate);
  }
  peertubeHelpers.getServerConfig()
    .then(config => {
      if (debugEnabled) {
        console.log('⚡️Fetched server config.', config);
      }
      instanceName = config.instance.name;

    })
  try {
    let versionResult = await axios.get(basePath + "/getversion");
    if (versionResult && versionResult.data) {
      softwareVersion = versionResult.data;
    }
  } catch (err) {
    console.log("⚡️error getting software version", basePath, err);
  }
  registerHook({
    target: 'action:auth-user.logged-out',
    handler: async () => {
      walletAuthorized=false;
      authorizationChecked=false;
      accountAddress=undefined;
      userName = "PeerTuber";
      boostFrom = userName;
      accountName = undefined;
      streamEnabled = false;
      wallet = undefined;
      v4vSettings= undefined;
    }
  })

  registerHook({
    target: 'action:video-watch.video-threads.loaded',
    handler: async () => {
      let comments = document.getElementsByClassName("comment-account-fid");
      let dates = document.getElementsByClassName("comment-date");
      for (var com in comments) {
        let comment = comments[com];
        let date = dates[com];
        let thread
        if (date && date.href) {
          thread = date.href.split("=")[1];
        } else {
          //console.log("⚡️no thread id", date);
          continue;
        }
        let walletApi, walletData, wallet;
        if (comment.wallet) {
          continue;
        }
        if (comment.innerText) {
          try {
            walletApi = basePath + "/walletinfo?account=" + comment.innerText
            walletData = await axios.get(walletApi);
            comment.wallet = walletData.data
          } catch {
            console.log("⚡️error trying to get wallet info", walletApi);
          }
        }
        if (walletData && walletData.data) {
          if ((walletData.data.keysend && keysendEnabled) || (walletData.data.lnurl && lnurlEnabled)) {
            if (debugEnabled) {
              console.log("⚡️wallet found", walletData.data.keysend, keysendEnabled, walletData.lnurl, lnurlEnabled)
            }
            let precheck = document.getElementById(thread);
            if (precheck) {
              //console.log("⚡️found zap");
              continue;
            }

            let zap = document.createElement("span");
            zap.innerHTML = "⚡️";
            zap.class = "action-button action-button-zap";
            zap.className = "action-button action-button-zap";
            zap.ariaPressed = "false";
            zap.title = "Zap sats to " + comment.innerText;
            zap.id = thread;
            zap.url = date.href;
            zap.comentid = thread;
            zap.target = comment.innerText;
            zap.style = "cursor:pointer";
            if (debugEnabled) {
             console.log("⚡️comment zap data", zap);
            }
            let grandParent = comment.parentElement.parentElement;
            let greatGrandParent = comment.parentElement.parentElement.parentElement;
            if (debugEnabled) {
              console.log(zap);
            }
            greatGrandParent.insertBefore(zap, grandParent);
            let zapButton = document.getElementById(thread);
            //console.log(zapButton);
            if (zapButton) {
              zapButton.onclick = async function () {
                walletData = null;
                this.innerText = "🗲";
                if (comment.innerText) {
                  try {
                    walletApi = basePath + "/walletinfo?account=" + comment.innerText
                    walletData = await axios.get(walletApi);
                  } catch {
                    console.log("⚡️error trying to get wallet info for comment account", walletApi);
                  }
                }
                if (walletData && walletData.data) {
                  wallet = walletData.data;
                  let weblnSupport = await checkWebLnSupport();
                  if ((wallet.keysend && (weblnSupport > 1) && keysendEnabled) || walletAuthorized) {
                    await boost(wallet.keysend, 69, "Keysend Cross App Comment Zap", userName, userName, null, "boost", null, null, 69, this.target, accountAddress);
                  } else if (wallet.lnurl && lnurlEnabled) {
                    await sendSats(wallet.lnurl, 69, "Cross App Comment Zap from " + userName, userName);
                  }
                }
                this.innerHTML = "⚡️";
              }
            }
          } else {
            if (debugEnabled) {
              console.log("⚡️wallet doesn't support required address type", walletData.data.address);
            }
          }
        } else {
          if (debugEnabled) {
            console.log("⚡️didn't find wallet data", walletApi)
          }
        }
      }
    }
  })
  registerHook({
    target: 'action:video-watch.video-thread-replies.loaded',
    handler: async () => {
      if (debugEnabled) {
        console.log("⚡️thread action popped wtfbbq");
      }
      let comments = document.getElementsByClassName("comment-account-fid");
      let dates = document.getElementsByClassName("comment-date");
      for (var com in comments) {
        let comment = comments[com];
        let date = dates[com];
        let thread
        if (date && date.href) {
          thread = date.href.split("=")[1];
        } else {
         // console.log("⚡️no thread id", date);
          continue;
        }
        if (debugEnabled) {
          console.log("⚡️comment data", com, comment.innerText, date.href);
        }
        let walletApi, walletData, wallet;
        if (comment.wallet) {
          if (debugEnabled) {
            console.log("⚡️wallet already set for comment", comment.wallet);
          }
          continue;
        }
        if (comment.innerText) {
          try {
            walletApi = basePath + "/walletinfo?account=" + comment.innerText
            walletData = await axios.get(walletApi);
            comment.wallet = walletData.data
          } catch {
            console.log("⚡️error trying to get wallet info", walletApi);
          }
        }
        if (walletData && walletData.data) {
          if ((walletData.data.keysend && keysendEnabled) || (walletData.data.lnurl && lnurlEnabled)) {
            if (debugEnabled) {
              console.log("⚡️zap compatibility matching",walletData.data.keysend, keysendEnabled, walletData.lnurl, lnurlEnabled)
            }
            let zap = document.createElement("span");
            zap.innerHTML = "⚡️";
            zap.class = "action-button action-button-zap";
            zap.className = "action-button action-button-zap";
            zap.ariaPressed = "false";
            zap.title = "Zap sats to " + comment.innerText;
            zap.id = thread + "-" + com;
            //console.log(thread,com,zap.id,thread+"-"+com,com.toString());
            zap.url = date.href;
            zap.comentid = thread;
            zap.target = comment.innerText;
            zap.style = "cursor:pointer";
            let grandParent = comment.parentElement.parentElement;
            let greatGrandParent = comment.parentElement.parentElement.parentElement;
            if (debugEnabled) {
              console.log(zap);
            }
            greatGrandParent.insertBefore(zap, grandParent);
            let zapButton = document.getElementById(zap.id);
            //console.log("⚡️zapButton",zapButton);
            if (zapButton) {
              zapButton.onclick = async function () {
                walletData = null;
                this.innerText = "🗲";
                if (comment.innerText) {
                  try {
                    walletApi = basePath + "/walletinfo?account=" + comment.innerText
                    walletData = await axios.get(walletApi);
                  } catch {
                    console.log("⚡️error trying to get wallet info", walletApi);
                  }
                }
                if (walletData) {
                  wallet = walletData.data;
                  let weblnSupport = await checkWebLnSupport();
                  let threadId = this.id.split("-")[0];
                  let link = window.location.href + ";threadId=" + threadId;
                  if (debugEnabled) {
                    console.log("⚡️thread link", link, this.id);
                  }
                  if ((wallet.keysend && (weblnSupport > 1) && keysendEnabled) || walletAuthorized) {
                    await boost(wallet.keysend, 69, "Keysend Zap: " + link, userName, userName, null, "boost", null, null, 69, this.target, accountAddress);
                  } else if (wallet.lnurl && lnurlEnabled) {
                    await sendSats(wallet.lnurl, 69, "LNURL Zap: " + link, userName);
                  }
                }
                this.innerHTML = "⚡️";
              }
            }
          } else {
            if (debugEnabled) {
              console.log("⚡️wallet doesn't support required address type", walletData.data.address);
            }
          }
        } else {
          if (debugEnabled) {
            console.log("⚡️didn't find wallet data", walletApi)
          }
        }
      }
    }
  })
  registerHook({
    target: 'filter:api.video-watch.video-threads.list.result',
    handler: async (result, params) => {
      if (debugEnabled) {
        console.log("⚡️thread filter hook", result, params)
      }
      //result.data[0].account.displayName=`<a href="https://google.com">zap</a>`
      return result;
    }
  })
  /*
  registerHook({
    target: 'action:embed.player.loaded',
    handler: async ({ player, videojs, video }) => {
      console.log("⚡️embedded within the wall", player, videojs, video);
      let x = document.getElementsByClassName("vjs-control-bar");
      console.log("⚡️menu", x.length);
    }
  })
 
  registerHook({
    target: 'filter:left-menu.links.create.result',
    handler: (result, params) => {
      console.log("starting left menu creator blcok", params, result);
      return [
        {
          key: 'in-my-stuff',
          title: 'Matt\'s Stuff',
          links: [
            {
              path: 'https://www.mattchristiansenmedia.com/shop#!/',
              //icon: 'alert',
              shortLabel: 'Shop',
              label: 'shop'
            },

            {
              path: 'https://www.mattchristiansenmedia.com/columns',
              icon: '',
              shortLabel: 'Columns  ',
              label: 'Columns'
            },
            {
              path: 'https://www.mattchristiansenmedia.com/support',
              icon: '',
              shortLabel: 'Support',
              label: 'Support'
            },

            {
              path: 'https://www.mattchristiansenmedia.com/deals',
              icon: '',
              shortLabel: 'Deals',
              label: 'Deals'
            }
          ]
        }
      ].concat(result)
    }
  })
*/
  async function sendSats(walletData, amount, message, from) {
    if (debugEnabled) {
      console.log("⚡️sending lnurl boost", walletData, amount, message, from);
    }
    if (!lnurlEnabled) {
      return;
    }
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
    /*
    if (!parseInt(amount)) {
      amount = "69";
    }
    */
    //fixing millisats for lnpay
    amount = amount * 1000
    //("parsint", parseInt(amount));
    let supported = await checkWebLnSupport();
    if (debugEnabled) {
      console.log("⚡️webln enabled:", supported);
    }
    let urlCallback = encodeURI(walletData.callback);
    let urlComment = encodeURIComponent(comment);
    let invoiceApi = basePath + "/getinvoice?callback=" + urlCallback + "&amount=" + amount;
    if (comment != "") {
      invoiceApi = invoiceApi + "&message=" + urlComment;
    }
    try {
      result = await axios.get(invoiceApi);
    } catch (err) {
      console.log("⚡️error getting lnurl invoice"), invoiceApi;
      return;
    }
    let invoice = result.data.pr;
    try {
      if (supported > 0) {
        result = await window.webln.sendPayment(invoice);
        var tipfixed = amount / 1000
        notifier.success("⚡" + tipfixed + "($" + (tipfixed * convertRate).toFixed(2) + ") " + tipVerb + " sent");
        doConfetti(amount);
        return result;
      } else {
        makeQrDialog(invoice);
        return;
      }
    } catch (err) {
      notifier.error("failed sending " + tipVerb + "\n" + err.message);
      return;
    }
  }
  async function boost(walletData, amount, message, from, channel, episode, type, episodeGuid, itemID, boostTotal, splitName, replyAddress,remoteFeed,remoteItem) {
    if (debugEnabled) {
      console.log("⚡️boost called\n Authorized", walletAuthorized,"\nwalletData", walletData, "\namount",amount ,"\nmessage", message, "\nfrom",from, "\nchannel",channel, episode, "\ntype",type, episodeGuid, "\n channel",channelName, "\n item id",itemID,"\n boost total",boostTotal,"\nsplit name",splitName,"\nreply address:",replyAddress)
    }
    if (!keysendEnabled) {
      return;
    }
    if (!walletAuthorized) {
      try {
        let supported = await checkWebLnSupport();
        if (debugEnabled) {
          console.log("⚡️supported value for webln in boost ", supported);
        }
        if (supported < 2) {
          await sendSats(walletData, amount, message);
          return;
        }
      } catch {
        //not supporting
        await sendSats(walletData, amount, message);
        return;
      }
    }
    let remoteHost, remoteUser, localHost;
    amount = Math.floor(amount)
    if (parseInt(amount) < 3) { return true }

    if (!from) {
      from = "Anon";
    }
    if (from != userName) {
      userName = from;
    }
    if (!type) {
      type = "boost";
    }
    if (channelName) {
      let parts = channelName.split("@");
      remoteUser = parts[0];
      if (parts.length > 1) {
        remoteHost = parts[1];
      }
    }
    if (!walletData || !walletData.pubkey) {
      notifier.error("Target wallet doesn't have a keysend address, bug errhead to put in legacy support for luddites");
      return;
    }
    let pubKey = walletData.pubkey;
    let tag = walletData.tag;
    let customKeyHack, customValue
    if (walletData.customData && walletData.customData[0]) {
      customKeyHack = walletData.customData[0].customKey;
      customValue = walletData.customData[0].customValue;
    }
    if (!splitName) {
      splitName = channel;
    }
    if (!boostTotal) {
      boostTotal = amount;
    }
    let version;
    try {
      let versionResult = await axios.get(basePath + "/getversion");
      if (versionResult && versionResult.data) {
        version = versionResult.data;
      }
    } catch (err) {
      console.log("⚡️error getting software version", basePath, err);
    }
    var boost = {
      action: type,
      value_msat: amount * 1000,
      value_msat_total: boostTotal * 1000,
      app_name: "PeerTube",
      app_version: version,
      name: splitName,
    };
    if (type == "stream") {
      boost.seconds_back = 60;
    }
    if (from) {
      boost.sender_name = from;
    }
    if (message) {
      boost.message = message;
    }
    if (currentTime) {
      boost.ts = parseInt(currentTime.toFixed());
    } else {
      console.log("⚡️no current time value for boost", boost);
    }
    if (channelName) {
      boost.podcast = channelName;
    }
    if (episode) {
      boost.episode = episode;
    }
    // for some reason episode guid is the url not an actual guid but a url.
      if (episodeGuid) {
        boost.episode_guid = episodeGuid;
      }
    /* okay, now i'm told episode guid is a the straight guid and not a url.
    if (window.location.href) {
      boost.episode_guid = window.location.href;
    }
    */
    if (window.location.href) {
      let parts = window.location.href.split('/');
      localHost = parts[2];
    }
    //console.log("Boost URL",boost.url,remoteHost,localHost);
    boost.boost_link = window.location.href;
    if (currentTime) {
      boost.boost_link = boost.boost_link + "?start=" + currentTime.toFixed();
    }
    if (channelName) {
      if (remoteHost) {
        //boost.url = window.location.protocol + "//" + remoteHost + "/plugins/lightning/router/podcast2?channel=" + channelName
        boost.url = window.location.protocol + "//" + remoteHost + "/feeds/podcast/videos.xml?videoChannelId="+channelId;
      } else {
        boost.url = window.location.protocol + "//" + localHost + "/feeds/podcast/videos.xml?videoChannelId="+channelId;
        /*
        if (rssEnabled){
          boost.url = window.location.protocol + "//" + localHost + "/plugins/lightning/router/podcast2?channel=" + channelName
        } else {
          boost.url = window.location.protocol + "//" + localHost + "/feeds/podcast/videos.xml?videoChannelId="+channelId;
        }
        */
      }
      
    }
    //console.log("Boost URL",boost.url,remoteHost,localHost);
    if (episodeGuid) {
      let itemApi = basePath + "/getitemid?uuid=" + episodeGuid;
      try {
        let itemId = await axios.get(itemApi);
        if (itemId) {
          boost.itemID = itemId.data;
        }
      } catch (err) {
        console.log("⚡️error getting itemid", itemApi, err);
      }
    }
    if (channelName) {
      let feedApi = basePath + "/getfeedid?channel=" + channelName;
      try {
        let feedId = await axios.get(feedApi);
        if (feedId) {
          boost.feedID = feedId.data;
        }
      } catch (err) {
        console.log("⚡️error getting feed id error", feedApi, err);
      }
      boost.guid = await getChannelGuid(channelName);
      //console.log("⚡️boost guid", boost.guid, typeof (boost.guid));
    }
    if (replyAddress) {
      boost.reply_address = replyAddress;
    }
    if (remoteFeed){
      boost.remote_feed_guid = remoteFeed;
    }
    if (remoteItem){
      boost.remote_item_guid = remoteItem;
    }
    if (debugEnabled) {
      console.log("⚡️**boost**", boost)
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
    if (debugEnabled) {
      console.log("⚡️payment info", paymentInfo);
    }
    let result;
    let albyBoostResult;
    if (walletAuthorized) {
      try {
        let sendBoostApi = basePath + "/sendalbypayment"
        //console.log("⚡️send boost api",sendBoostApi)
        albyBoostResult = await axios.post(sendBoostApi, paymentInfo, { headers: await peertubeHelpers.getAuthHeader() });
        if (debugEnabled) {
          console.log("⚡️alby boost result",albyBoostResult);
        }
        var tipfixed = amount
        await notifier.success("⚡" + tipfixed + "($" + (tipfixed * convertRate).toFixed(2) + ") " + tipVerb + " sent via integrated wallet");
        await doConfetti(boostTotal);
        return albyBoostResult;
      } catch (err) {
        console.log("⚡️error attempting to send sats using integrated wallet", err);
        notifier.error("⚡ not sent via integrated wallet");
        return albyBoostResult;
      }
    }
    try {
      result = await webln.keysend(paymentInfo);
      var tipfixed = amount
      notifier.success("⚡" + tipfixed + "($" + (tipfixed * convertRate).toFixed(2) + ") " + tipVerb + " sent");
      doConfetti(boostTotal);
      return result;
    } catch (err) {
      notifier.error("⚡ error attempting to send sats using keysend", err.message);
      return;
    }
  }
  function doConfetti(boost) {
    switch (boost) {
      case '69': jsConfetti.addConfetti({ emojis: ['💋'], confettiNumber: 10 }); break;
      case '73': jsConfetti.addConfetti({ emojis: ['👋'] }); break;
      case '88': jsConfetti.addConfetti({ emojis: ['🥰'] }); break;
      case '314': jsConfetti.addConfetti({ emojis: ['🥧'] }); break;
      case '321': jsConfetti.addConfetti({ emojis: ['💥'] }); break;
      case '420': jsConfetti.addConfetti({ emojis: ['✌', '👽', '💨'] }); break;
      case '666': jsConfetti.addConfetti({ emojis: ['😇'] }); break;
      case '777': jsConfetti.addConfetti({ emojis: ['😈'] }); break;
      case '1776': jsConfetti.addConfetti({ emojis: ['🇺🇸'] }); break;
      case '1867': jsConfetti.addConfetti({ emojis: ['ca'] }); break;
      case '2112': jsConfetti.addConfetti({ emojis: ['🖼️'] }); break;
      case '4321': jsConfetti.addConfetti({ emojis: ['💥'], confettiNumber: 50 }); break;
      case '6006': jsConfetti.addConfetti({ emojis: ['🎱🎱'] }); break;
      case '8008': jsConfetti.addConfetti({ emojis: ['🎱🎱'] }); break;
      case '9653': jsConfetti.addConfetti({ emojis: ['🐺'] }); break;
      case '30057': jsConfetti.addConfetti({ emojis: ['🔁'] }); break;
      case '3005': jsConfetti.addConfetti({ emojis: ['😇'] }); break;
      case '6969': jsConfetti.addConfetti({ emojis: ['💋'], confettiNumber: 50 }); break;
      case '42069': jsConfetti.addConfetti({ emojis: ['🌈', '⚡️', '💥', '✨', '💫', '🌸'] }); break;
      case '54321': jsConfetti.addConfetti({ emojis: ['💥'], confettiNumber: 300 }); break;
      case '696969': jsConfetti.addConfetti({ emojis: ['💋'], confettiNumber: 300 }); break;
      default:
        let size = 30;
        if (boost > 1000) { size = 64 };
        if (boost > 10000) { size = 128 };
        if (boost > 1000000) { size = 256 };
        if (boost > 10000000) { size = 512 };
        if (boost > 100000000) { size = 1024 };
        jsConfetti.addConfetti({ confettiNumber: size });
    }
    return;
  }
  async function buildBoostObject(walletData, amount, message, from, channel, episode, type, episodeGuid, itemID, boostTotal, splitName, replyAddress) {
    if (debugEnabled) {
      console.log("⚡️boost called", walletData, amount, message, from, channel, episode, type, episodeGuid, channelName, itemID,"\nsplit name",splitName,"\nreply address:",replyAddress);
    }
    let remoteHost, remoteUser, localHost;
    if (parseInt(amount) < 5) { return }
    if (!type) { type = "boost" }
    if (channelName) {
      let parts = channelName.split("@");
      remoteUser = parts[0];
      if (parts.length > 0) {
        remoteHost = parts[1];
      }
    }
    let pubKey = walletData.pubkey;
    let tag = walletData.tag;
    let customKeyHack, customValue
    if (walletData.customData) {
      customKeyHack = walletData.customData[0].customKey;
      customValue = walletData.customData[0].customValue;
    }
    if (!splitName) { splitName = channel }
    if (!boostTotal) { boostTotal = amount }
    let version = softwareVersion;
    var boost = {
      action: type,
      value_msat: amount * 1000,
      value_msat_total: boostTotal * 1000,
      app_name: "PeerTube",
      app_version: version,
      name: splitName,
    };
    // deprecated if (type == "stream") {boost.seconds_back = 60}
    if (from) { boost.sender_name = from }
    if (message) { boost.message = message }
    if (currentTime) { boost.ts = parseInt(currentTime.toFixed()) }
    if (channelName) { boost.podcast = channelName }
    if (episode) { boost.episode = episode }
    if (window.location.href) {
      boost.episode_guid = window.location.href;
      let parts = boost.episode_guid.split('/');
      localHost = parts[2];
      if (remoteHost) {
        boost.episode_guid = "https://" + remoteHost + "/" + parts[3] + "/" + parts[4];
        localHost = parts[2];
      }
    }
    boost.boost_link = window.location.href;
    if (currentTime) { boost.boost_link = boost.boost_link + "?start=" + currentTime.toFixed() }
    if (channelName) {
      if (remoteHost) {
        boost.url = window.location.protocol + "//" + remoteHost + "/plugins/lightning/router/podcast2?channel=" + channelName
      } else {
        boost.url = window.location.protocol + "//" + localHost + "/plugins/lightning/router/podcast2?channel=" + channelName
      }

    }
    if (episodeGuid) {
      let itemApi = basePath + "/getitemid?uuid=" + episodeGuid;
      try {
        let itemId = await axios.get(itemApi);
        if (itemId) {
          boost.itemID = itemId.data;
        }
      } catch (err) {
        console.log("⚡️error getting itemid", itemApi, err);
      }
    }
    if (channelName) {
      let feedApi = basePath + "/getfeedid?channel=" + channelName;
      try {
        let feedId = await axios.get(feedApi);
        if (feedId) {
          boost.feedID = feedId.data;
        }
      } catch (err) {
        console.log("⚡️error getting feed id error", feedApi, err);
      }
      let tempfix = getChannelGuid(channelName);
    }
    if (replyAddress) { boost.reply_address = replyAddress }
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
    if (debugEnabled) {
      console.log("⚡️payment info", paymentInfo);
    }
    return paymentInfo;
  }
  async function getFeedID(channel) {
    let feedApi = basePath + "/getfeedid?channel=" + channel;
    try {
      let feedId = await axios.get(feedApi);
      if (feedId) {
        return feedId.data;
      }
    } catch (err) {
      return;
    }
  }
  async function setFeedID(channel, feedID) {
    let feedApi = basePath + "/setfeedid?channel=" + channel + "&feedid=" + feedID;
    try {
      await axios.get(feedApi);
    } catch (err) {
      console.log("⚡️error attempting to fetch feed id", err);
    }
  }
  async function getWalletInfo() {
    if (debugEnabled) {
      console.log("⚡️get wallet info", videoName, accountName, channelName, instanceName);
    }
    let walletApi = basePath + "/walletinfo";
    if (videoName) {
      if (instanceName) {
        walletApi = walletApi + "?video=" + videoName + "&account=" + accountName + "@" + instanceName + "&channel=" + channelName + "@" + instanceName;
      } else {t
        walletApi = walletApi + "?video=" + videoName + "&account=" + accountName + "&channel=" + channelName;
      }
    } else {
      if (accountName) {
        walletApi = walletApi + "?account=" + accountName;
      }
      if (channelName) {
        walletApi = walletApi + "?channel=" + channelName;
      }
      if (instanceName) {
        walletApi = walletApi + "@" + instanceName;
      }
    }
    if (debugEnabled) {
      console.log("⚡️api call for video wallet info", walletApi);
    }
    let walletData;
    try {
      walletData = await axios.get(walletApi);
    } catch {
      console.log("⚡️client unable to fetch wallet data\n", walletApi);
      return;
    }
    return walletData.data;
  }
  async function getSplit(force) {
    if (debugEnabled) {
      console.log("⚡️generating split request", videoName, accountName, channelName, instanceName, currentTime, hostPath,window.location.hostname);
    }
    let splitApi;
   // if (force && (instanceName != hostPath)){
   //   splitApi = `https://${instanceName}/plugins/lightning/router/getsplit`;
   // } else {
    splitApi = basePath + "/getsplit";
    let spot=Math.trunc(currentTime);
    if (videoName) {
      if (instanceName == "hack") {
        splitApi = splitApi + "?video=" + videoName + "&account=" + accountName + "@" + instanceName + "&channel=" + channelName + "@" + instanceName;
      } else {
        splitApi = splitApi + "?video=" + videoName + "&account=" + accountName + "&channel=" + channelName;
      }
    } else {
      //if (accountName) {
      //  splitApi = splitApi + "?account=" + accountName;
      //}
      if (channelName) {
        splitApi = splitApi + "?channel=" + channelName;
      }
      if (instanceName == "hack") {
        splitApi = splitApi + "@" + instanceName;
      }
    }
    
    splitApi=splitApi+"&ts="+spot;
    if (debugEnabled) {
      console.log("⚡️api call for split info", splitApi);
    }
    let splitData;
    try {
      splitData = await axios.get(splitApi);
    } catch {
      console.log("⚡️client unable to fetch split data\n", splitApi);

      return;
    }
    /*
    var splitTotal = 0;
    let missing = 0;
    for (var split of splitData.data) {
      if (debugEnabled) {
        console.log("⚡️ split math ", splitTotal, split.split, split);
        if (split.keysend && split.keysend.retrieved){
          var lastsync=new Date(split.keysend.retrieved);
          var syncdate = lastsync.toLocaleDateString;
          console.log("⚡️ cache date:",split.keysend.retrieved,lastsync,syncdate);
        }
      }
      if (!Number.isInteger(split.split)) {
        console.log("⚡️ no split value found ", split);
        missing++
      } else {
        splitTotal = splitTotal + split.split;
      }
    }
    if (Number.isInteger(splitTotal) && splitTotal != 100) {
      console.log("⚡️Split math error!", splitTotal, splitData.data);
      if (missing == 1) {
        let fixSplit = 100 - splitTotal;
        for (var split of splitData.data) {
          if (!Number.isInteger(split.split)) {
            split.split = fixSplit;
          }
        }
      }

    }
    */
    if (debugEnabled) {
      console.log("⚡️returned split for video", splitData.data);
    }
    return splitData.data;
  }
  async function refreshWalletInfo(address) {
    if (address) {
      if (address.indexOf("@") < 1) {
        console.log("⚡️not a valid address")
        return;
      }
      let walletApi = basePath + "/walletinfo?address=" + address;
      if (debugEnabled) {
        console.log("⚡️api call for video wallet refresh", walletApi);
      }
      let walletData;
      try {
        walletData = await axios.get(walletApi);
      } catch {
        console.log("⚡️client unable to fetch wallet data\n", walletApi);
        return;
      }
      return walletData.data;
    }
  }
  async function alertUnsupported() {
    peertubeHelpers.showModal({
      title: 'No WebLN provider found',
      content: `<p>You can get the <a href ="https://getalby.com/">Alby plug in</a> for most popular browsers.<br>
       You can use one of their wallets, or link the plugin to <a href="https://cryptonews.com/exclusives/7-popular-bitcoin-lightning-network-wallets-for-2022.htm">any lightning compatible wallet</a><p>
       There are <a href= "https://webln.dev/#/">Several other options</a> for using WebLN available as well<p>
       `,
      close: true,
    })
  }
  async function getConfigPanel(splitInfo, channel) {
    let feedID = await getFeedID(channel);
    if (debugEnabled) {
      console.log("⚡️getting config panel", splitInfo, feedID, channel);
    }
    let html = `<br><label _ngcontent-msy-c247="" for="Wallet">Lightning Splits</label><br>`
    if (splitInfo && (keysendEnabled || lnurlEnabled)) {
      if (splitInfo.length > 0) {
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
    } else {
      html = html + `<button type="button" id="create-split" class="peertube-button orange-button ng-star-inserted">Add Lightning Address</button>`

    }
    html = html + `<button type="button" id="edit-levels" class="peertube-button orange-button ng-star-inserted">Edit Patronage Levels</button>`
    html = html + "<hr>"

    //html = html + "<br>podcast 2.0 RSS feed URL: " + rssFeedUrl;
    const panel = document.createElement('div');
    panel.setAttribute('class', 'lightning-button');
    panel.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
    panel.innerHTML = html;
    return panel;
  }
  async function buildTip(splitData, displayName, episodeName, episodeGuid, itemID) {
    if (debugEnabled) {
      console.log("⚡️clicked on tip button", splitData, channelName, displayName, episodeName, episodeGuid, itemID);
    }
    let amount = document.getElementById('modal-sats').value;
    let message = document.getElementById('modal-message').value;
    let from = document.getElementById('modal-from').value;
    let weblnSupport;
    if (!walletAuthorized) {
      weblnSupport = await checkWebLnSupport();
    } else {
      weblnSupport = 69
    }
    lastTip = amount;
    //notifier.success(weblnSupport);
    let result;
    let remoteFeed = splitData[0].feedguid;
    let remoteItem = splitData[0].itemguid;
    for (var wallet of splitData) {
      var splitAmount = amount * (wallet.split / 100);
      if ((wallet.keysend && (weblnSupport > 1) && keysendEnabled) || walletAuthorized) {
        if (debugEnabled) {
          console.log("⚡️sending keysend boost", wallet.keysend, splitAmount, message, from, displayName, episodeName, "boost", episodeGuid, channelName, itemID, amount, wallet.name)
        }
        result = await boost(wallet.keysend, splitAmount, message, from, displayName, episodeName, "boost", episodeGuid, itemID, amount, wallet.name, accountAddress,remoteFeed,remoteItem);
      } else if (wallet.lnurl && lnurlEnabled) {
        if (debugEnabled) {
          console.log("⚡️sending lnurl boost", wallet.lnurl, splitAmount, message, from);
        }
        result = await sendSats(wallet.lnurl, splitAmount, message, from);
        if (!result) {
          console.log("⚡️error sending lnurl boost", wallet.lnurl, splitAmount, message, from);
        }
      }
    }
    if (result) {
      closeModal();
      return;
    } else {
      notifier.error("error attempting send " + tipVerb + " to " + displayName);
      return;
    }
  }
  async function makeQrDialog(invoice) {
    if (debugEnabled) {
      console.log("⚡️making qr dialog", invoice);
    }
    /* Mobile wallet usability is too broken to automate
    if (navigator.userAgentData.mobile) {
      navigator.clipboard.writeText(invoice);
      window.open("lightning:" + invoice);
      return;
    }
    */
    //console.log(navigator.userAgent);
    let html = "<h1>No WebLN Found</h1>" + navigator.userAgentData.mobile + "<br>" +
      `We were unable to find a WebLN provider in your browser to automate the ` + tipVerb +
      ` process. This is much easier if you get the <a href="https://getalby.com">Alby browser plug-in</a>` +
      `<br> If you have a wallet you can scan this qr code, open a local wallet, or copy/paste the ` +
      `provided code to a wallet` +
      `<center><div id="qr-holder"></canvas></div>` +
      `<a href="lightning:` + invoice + `"><button type="button" id="launch" name="launch" class="peertube-button orange-button ng-star-inserted">open local wallet</button></a>` +
      `<button type="button" id="copy" name="copy" class="peertube-button orange-button ng-star-inserted">Copy to clipboard</button></center>`;

    let modal = (document.getElementsByClassName('modal-body'))

    if (modal[0]) {
      modal[0].innerHTML = html;
    } else {
      await peertubeHelpers.showModal({
        title: 'zap',
        content: "",
        close: true,
        // confirm: { value: 'X', action: () => { } },
      })
      modal = (document.getElementsByClassName('modal-body'))
      if (modal[0]) {
        modal[0].innerHTML = html;
      } else {
        console.log("⚡️unable to find new modal window");
        return;
      }
    }
    var qr = await new QRious({
      element: document.querySelector('qr'),
      value: invoice,
      size: 256,
    });
    let qrHolder = document.getElementById('qr-holder')
    if (qrHolder) {
      qrHolder.appendChild(qr.image);
    }
    let copyButton = document.getElementById('copy');
    if (copyButton) {
      copyButton.onclick = async function () {
        navigator.clipboard.writeText(invoice);
        copyButton.textContent = "Copied!";
        return;
      }
    }
    let localWallet = document.getElementById("launch");
    if (localWallet) {
      localWallet.onclick = async function () {
        navigator.clipboard.writeText(invoice);
        //console.log("⚡️copied invoice to clipboard");
      }
    }
  }
  async function makeTipDialog(DisplayName,splitData) {
    if (debugEnabled) {
      console.log("⚡️making tip dialog", channelName,currentTime,remoteSplitBlock);
    }
    let finalSplit;
    if (remoteSplitBlock){
      for (var block of remoteSplitBlock.blocks){
        if (block){
          //console.log("block",block.settings,block.startTime,block.duration );
          let blockStart = block.startTime;
          let blockEnd = blockStart+block.duration;
          //console.log("barf",blockStart,blockEnd, currentTime)
          if (blockStart<=currentTime && (blockEnd >= currentTime)){
            if (debugEnabled){
            console.log("Remote block active!",block);
            }
            finalSplit = await calculateSplit(splitData,block.value.destinations, block.settings.split);
            finalSplit[0].title = block.title;
            finalSplit[0].image = block.image;
            finalSplit[0].itemguid = block.itemGuid;
            finalSplit[0].feedguid = block.feedGuid;
            if (debugEnabled){
              console.log("final split value of after calculating remote split",finalSplit);
            }
          }

        }
      }
    }
    if (finalSplit){
      splitData = finalSplit;
    }
    let buttonText = '⚡️' + tipVerb + " " + channelName + '⚡️';
    if (splitData && splitData[0] && splitData[0].title){
      buttonText = '⚡️' + tipVerb + " " + splitData[0].title + '⚡️';
    }
    let html = ` <center><table><tr><td>From:</td>
   <td style="text-align:right;"><input class="form-control d-block ng-pristine ng-valid ng-touched" type="text" id="modal-from" name="modal-from" value="`+ boostFrom + `" autocomplete="on" maxLength="28"></td></tr>
   <tr><td>Sats:</td>
   <td style="text-align:right;"><input class="form-control d-block ng-pristine ng-valid ng-touched" type="text" id="modal-sats" name="modal-sats" value="${v4vSettings.boostAmount}" size="6"></td></tr>

    <td>&nbsp;</td><td style="text-align:right;">~$ <label id="modal-cashtip" name="modal-cashtip">`+ (v4vSettings.boostAmount * convertRate).toFixed(3) + `</label></td></tr>

    <tr><td><label for="message">Message:</label><br></td></tr>

    <tr><td colspan="2"><textarea STYLE="color: #000000; background-color: #ffffff; flex: 1;" rows="3" cols=30 id="modal-message" name="modal-message"></textarea>
    </td></tr></table>
    <br><button _ngcontent-vww-c178=""  id = "modal-satbutton" class="peertube-button orange-button ng-star-inserted"  data-alli-title-id="24507269" title="satbutton">`+ buttonText + `</button>
    </center>`;
    //if (splitData[0].title){
    //  html=html+`<h3>${splitData[0].title}</h3>`
    //}

    if (splitData && splitData[0] && splitData[0].image){
      html=html+`<center><img src="${splitData[0].image}" width="200" height="200"></center>`;
    }
    for (var split of splitData){
      html=html+`<br> ${split.split}% ${split.name} `;
    }
    let modal = (document.getElementsByClassName('modal-body'))
    modal[0].innerHTML = html;
    let modalHack = document.getElementsByClassName("modal-dialog");
    if (modalHack) {
      if (debugEnabled) {
        console.log("⚡️modal", modalHack, modalHack[0], modalHack[0].class);
      }
      modalHack[0].setAttribute('class', 'modal-dialog modal-dialog-centered modal-sm');
      document.getElementsByClassName("modal-content")[0].setAttribute('style', 'width:auto;');
    }
    let modalSatTip = document.getElementById("modal-sats");
    let modalCashTip = document.getElementById("modal-cashtip");
    if (modalSatTip) {
      modalSatTip.onchange = async function () {
        modalCashTip.textContent = (modalSatTip.value * convertRate).toFixed(2);
      }
    }
    if (modalCashTip) {
      modalCashTip.onchange = async function () {
        modalSatTip.value = (modalCashTip.value / convertRate).toFixed();
      }
    }
    return splitData;
  }
  async function calculateSplit(localSplit,remoteSplit,remoteCut){
    let newSplit = [];
    let feeSplit = 0;
    let nonFeeSplit =0;
    if (debugEnabled){
      console.log("time for math",localSplit,remoteSplit);
    }
    for (var local of localSplit){
      if (local.fee){
        newSplit.push(local);
        feeSplit=feeSplit+local.split;
      } 
    }
    //console.log("breakdown local",feeSplit,nonFeeSplit);
    for (var remote of remoteSplit){
      if (remote.fee){
        let keysend = {
          pubkey: remote.address,
        }
        if (remote.customKey){
          let cd =[
          {customKey: remote.customKey,
          customValue: remote.customValue}
          ]
          keysend.customData = cd;
        }
        let split = {
          name: remote.name,
          split: remote.split,
          "keysend": keysend
        }
        //console.log("adding fee split",split,remote);
        newSplit.push(split);
        feeSplit=feeSplit+remote.split;
      } else {
        nonFeeSplit=nonFeeSplit+remote.split;
      }
    }
    //console.log("breakdown of all fees",newSplit,feeSplit,nonFeeSplit,remoteCut);
    if (remoteCut && remoteCut<100){
      let localCut = (100-remoteCut)/100;
      //console.log("cuts",localCut,remoteCut);
      for (var local of localSplit){
        let fixedSplit = Math.trunc(local.split*localCut);
        //console.log("percentage",fixedSplit,local.split,local.name);
        if (!local.fee && (fixedSplit)>=1){
          local.split=fixedSplit;
          newSplit.push(local);
          feeSplit=feeSplit+fixedSplit;
        } 
      }
    }
    let adjust =  (100-feeSplit)/nonFeeSplit;
    for (var remote of remoteSplit){
      if (!remote.fee){
        let keysend = {
          pubkey: remote.address,
        }
        if (remote.customKey){
          let cd =[
          {customKey: remote.customKey,
          customValue: remote.customValue}
          ]
          keysend.customData = cd;
        }
        let fixedSplit = Math.trunc(remote.split*adjust);
        //console.log("doit ",adjust,remote.split,fixedSplit);
        let split = {
          name: remote.name,
          split: fixedSplit,
          "keysend": keysend
        }
        newSplit.push(split);
      }
    }
    //console.log("final breakdown of all fees",newSplit,feeSplit,nonFeeSplit);
    return newSplit;
  }
  async function checkWebLnSupport() {
    if (walletAuthorized) {
      return 69;
    }
    try {
      await webln.enable()
      if (typeof webln.keysend === 'function') {
        if (debugEnabled) {
          console.log('⚡️✅ webln keysend support');
        }
        return 2;
      } else {
        if (debugEnabled) {
          console.log("⚡️✅ webln supported ⛔️ keysend not supported");
        }
        return 1;
      }
    } catch {
      if (debugEnabled) {
        console.log("⚡️⛔️ webln not supported");
      }
      return 0;
    }
  }
  async function makeStreamDialog() {
    if (debugEnabled) {
      console.log("⚡️making stream dialog", channelName);
    }
    let buttonText = '⚡️V4V⚡️';
    let html = `<div id="modal-streamdialog">
    Lightning address for boostbacks and cross app zaps. Works best with an address that supports keysend, which is currently <a href="https://getalby.com/podcast-wallet" target="_blank" rel="noopener noreferrer">Alby</a>, <a href="http://signup.hive.io/" target="_blank" rel="noopener noreferrer">Hive</a>, or <a href="https://support.fountain.fm/category/51-your-account-wallet" target="_blank" rel="noopener noreferrer">Fountain</a><br>
    <input class="form-control d-block ng-pristine ng-valid ng-touched" type="text" id="v4v-boost-back" name="v4v-boost-back" value="`+ accountAddress + `" size="42">
    <button id = "v4v-settings-update" class="peertube-button orange-button ng-star-inserted">Update</button>`;
    if (peertubeHelpers.isLoggedIn() && client_id) {
      html = html + `<br>Authorizing an Alby Wallet address allows for easy boosting and streaming payments without needing a browser extension<br>
      <button id = "v4v-wallet-authorize" class="peertube-button orange-button ng-star-inserted">Authorize Payments</button>`;
    }
    html = html + `<hr>
    <input class="form-control d-block ng-pristine ng-valid ng-touched" type="checkbox" id="v4v-stream-auto" name="v4v-stream-auto" value="streamsats">
    <label>Stream Sats per minute:</label>
    <input class="form-control d-block ng-pristine ng-valid ng-touched" type="text" id="v4v-stream-amount" name="v4v-stream-amount" value="`+ streamAmount + `" size="6">
    / $
    <input style="color: #16F529;" type="text" id="v4v-stream-cash" name="v4v-stream-cash" value="`+ (streamAmount * convertRate).toFixed(3) + `" size="6">
    </div>`;
    let subApi=basePath + `/getsubscriptions`;
    try {
      
      //console.log("⚡️trying to get subscription",subApi);
      let subscribed = await axios.get( subApi, { headers: await peertubeHelpers.getAuthHeader() });
      //console.log("⚡️subscription result",subscribed);
      if (subscribed && subscribed.data) {
        //console.log("⚡️subscribed ",subscribed.data);
        html = html + "<h2>Patronage</h2>"
        for (var sub of subscribed.data){
          let startDate= new Date(sub.startdate).toLocaleDateString()
          let link = "https://"+window.location.hostname+"/c/"+sub.channel;
          html = html+ `<a href=${link}>${sub.channel}</a> for ${sub.paiddays} days since ${startDate}<br>`;
        }
      } else {
        console.log("⚡️didn't get good subscription data");
      }
    } catch (err) {
        console.log("⚡️error attempting to get subscribed status", subApi, err);
    }
    let modal = (document.getElementsByClassName('modal-body'));
    modal[0].innerHTML = html;
    let modalSatStream = document.getElementById("v4v-stream-amount");
    let modalCashStream = document.getElementById("v4v-stream-cash");
    let modalSatTip = document.getElementById("modal-sats");
    let modalCashTip = document.getElementById("modal-cashtip");
    let menuStreamAmount = document.getElementById('streamamount');
    let modalAddressUpdate = document.getElementById('v4v-settings-update');
    let userAddress = document.getElementById('v4v-boost-back');
    let modalAddressAuthorize = document.getElementById("v4v-wallet-authorize");
    if (modalAddressAuthorize) {
      let authorizedWalletApi = basePath + "/checkauthorizedwallet";
      //console.log("⚡️authorized wallet api:",authorizedWalletApi);
      let headers = { headers: await peertubeHelpers.getAuthHeader() }
      //console.log("⚡️headers",headers)
      let authorized;
      try {
        authorized = await axios.get(authorizedWalletApi, headers);
        walletAuthorized = true;
      } catch {
        console.log("⚡️unable to confirm authorized");
        walletAuthorized = false;
      }
      //console.log("⚡️authorized result",authorized);
      let newUserAddress = userAddress.value;
      //console.log("⚡️wallet authorized",walletAuthorized,"newAddress",newUserAddress,"button",modalAddressAuthorize);
      modalAddressAuthorize.style.visible = false;
      if (client_id && peertubeHelpers.isLoggedIn()) {
        modalAddressAuthorize.style.visible = true;
        if (!walletAuthorized && newUserAddress.indexOf('getalby.com') > 1) {
          modalAddressAuthorize.textContent = "Authorize" 
        } else {
          modalAddressAuthorize.textContent = "De-Authorize";
        }
        modalAddressAuthorize.onclick = async function () {
          if (debugEnabled) {
            console.log("⚡️authorize button clicked", walletAuthorized);
          }
          if (walletAuthorized) {
            try {
              await axios.get(basePath + "/setauthorizedwallet?clear=true", { headers: await peertubeHelpers.getAuthHeader() });
              notifier.success("De-Authorized getalby wallet");
              walletAuthorized = false;
            } catch {
              notifier.error("error trying to deauthorize wallet")
            }
            closeModal();
            return;
          }
          let authorizeReturned;
          let authorizationUrl = basePath + "/setauthorizedwallet?address=" + userAddress.value
          let headers = { headers: await peertubeHelpers.getAuthHeader() }
          if (debugEnabled) {
            console.log("attempting to authorize", authorizationUrl, headers);
          }
          try {
            authorizeReturned = await axios.get(authorizationUrl, headers);
          } catch (err) {
            notifier.error("error trying to inform peertube of incoming authorization");
            console.log("error with authorization", err, authorizationUrl, headers);
          }
          let parts = basePath.split("/");
          let callbackPath = "https://" + hostPath + "/" + parts[1] + "/" + parts[2] + "/" + parts[4] + "/callback";

          let albyUrl = `https://getalby.com/oauth?client_id=` + client_id + `&response_type=code&redirect_uri=` + callbackPath + `&scope=account:read%20invoices:create%20invoices:read%20payments:send%20transactions:read&state=` + userName;
          if (debugEnabled) {
            console.log("callback", callbackPath, "\n alby url", albyUrl);
          }
          window.open(albyUrl, 'popup', 'width=600,height=800');
          closeModal();
        }
      }
    } else {
      console.log("⚡️no authorize button");
    }
    if (modalAddressUpdate) {
      modalAddressUpdate.onclick = async function () {
        let setWalletApi = basePath + "/setwallet?address=" + userAddress.value;
        //console.log("⚡️api call to update user lightningAddress",setWalletApi);
        modalAddressUpdate.value = "updating";
        try {
          let userData = await axios.get(setWalletApi, { headers: await peertubeHelpers.getAuthHeader() });
          if (userData && userData.data) {
            //console.log("⚡️user lightning address",userData.data);
            userAddress.value = userData.data.address;
            //accountAddress = userData.data.address;
            notifier.success("updated " + userName + "'s lighting address to " + accountAddress);
          } else {
            console.log("⚡️didn't get good user address");
            notifier.error("failed to udate " + userName + "'s lighting address to " + userAddress.value);
          }
        } catch (err) {
          console.log("⚡️error attempting to update user wallet", setWalletApi, err);
        }
        closeModal();
      }
    }
    if (modalSatStream) {
      modalSatStream.onchange = async function () {
        modalCashStream.value = (modalSatStream.value * convertRate).toFixed(2);
        streamAmount = modalSatStream.value
        if (menuStreamAmount) {
          menuStreamAmount.value = streamAmount;
        }
      }
    }
    if (modalCashStream) {
      modalCashStream.onchange = async function () {
        modalSatStream.value = (modalCashStream.value / convertRate).toFixed();
        streamAmount = modalSatStream.value;
        if (menuStreamAmount) {
          menuStreamAmount.value = streamAmount;
        }
      }
    }
    let modalChecker = document.getElementById("v4v-stream-auto");
    if (modalChecker) {
      if (streamEnabled) {
        modalChecker.checked = true;
      }
      modalChecker.onclick = async function () {
        //let modalChecker = document.getElementById("v4v-stream-auto");
        let menuChecker = document.getElementById("streamsats");
        let butt = document.getElementById("stream");
        streamEnabled = modalChecker.checked;
        var streamButtonText = "";
        if (streamEnabled) {
          streamButtonText = "⚡️" + streamAmount + "/min";
        } else {
          streamButtonText = "⚡️V4V";
        }
        butt.textContent = streamButtonText;
        if (menuChecker) {
          menuChecker.checked = streamEnabled;
        }
        let currentStreamAmount = document.getElementById('v4v-stream-amount');

        if (currentStreamAmount) {
          streamAmount = parseInt(currentStreamAmount.value);
          if (menuStreamAmount) {
            menuStreamAmount.value = streamAmount;
          }
          let dialog2Element = document.getElementById("streamdialog");
          if (dialog2Element) {
            if (streamEnabled) {
              dialog2Element.style.display = "block";
            } else {
              dialog2Element.style.display = "none"
            }
          }
        } else {
          console.log("⚡️really not sure how this error could logically be reached", currentStreamAmount, streamAmount);
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
  async function assignSplitEditButtons(splitData, slot, channel, ks) {
    if (debugEnabled) {
      console.log("⚡️assigning split edits", slot, channel, ks);
    }
    let updateSplit = document.getElementById("update-split")
    if (updateSplit) {
      updateSplit.onclick = async function () {
        if (debugEnabled) {
          console.log("⚡️update split clicked", channel, slot, ks)
        }
        let updateResult = await doUpdateSplit(channel, slot, ks);
        let newPanel = await getConfigPanel(updateResult, channel);
        let channelUpdate = document.getElementsByClassName("form-group");
        channelUpdate[0].removeChild(panelHack)
        channelUpdate[0].appendChild(newPanel);
        panelHack = newPanel;
        await assignEditButtons(updateResult, channel);
      }
    }
    let removeSplit = document.getElementById("remove-split")
    if (removeSplit) {
      removeSplit.onclick = async function () {
        let removeResult = await doRemoveSplit(channel, slot);
        let newPanel = await getConfigPanel(removeResult, channel);
        let channelUpdate = document.getElementsByClassName("form-group");
        channelUpdate[0].removeChild(panelHack)
        channelUpdate[0].appendChild(newPanel);
        panelHack = newPanel;
        await assignEditButtons(removeResult, channel);
      }
    }
    let manualKeysend = document.getElementById("manualkeysend");
    if (manualKeysend) {
      manualKeysend.checked = ks;
      manualKeysend.onclick = async function () {
        if (debugEnabled) {
          console.log("⚡️custom keysend data", manualKeysend, slot, ks, splitData[slot].customKeysend);
        }
        if (splitData[slot].customKeysend == true) {
          splitData[slot].customKeysend = false;
          ks = false;
          manualKeysend.checked = false
        } else {
          splitData[slot].customKeysend = true;
          ks = true;
          manualKeysend.checked = true;
        }
        if (debugEnabled) {
          console.log("⚡️post toggle custom keysend data", manualKeysend, slot, ks, splitData[slot].customKeysend);
        }
        //splitData[slot].customKeysend = manualKeysend.checked;
        let html = await makeKeysendHtml(splitData, slot, ks);
        let modal = (document.getElementsByClassName('modal-body'))
        modal[0].setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
        modal[0].innerHTML = html;
        await assignSplitEditButtons(splitData, slot, channel, ks);
      }
    }
  }
  async function assignEditButtons(splitData, channel) {
    if (splitData && splitData.length > 0) {
      let addButton = document.getElementById("add-split");
      if (addButton) {
        addButton.onclick = async function () {
          if (debugEnabled) {
            console.log("⚡️assigning edit butts!", splitData.length, channel);
          }
          await peertubeHelpers.showModal({
            title: 'Add Split for ' + channel,
            content: ` `,
            close: true,
            confirm: { value: 'X', action: () => { } },

          })
          let modal = (document.getElementsByClassName('modal-body'))
          //modal[0].setAttribute('class', 'lightning-button');
          modal[0].setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
          modal[0].innerHTML = await getDirectoryHtml()+`<br><label for="name">Display Name:</label><input class="form-control d-block ng-pristine ng-valid ng-touched"  type="text" id="modal-split-name" value=""><br>
          Enter lightning address (i.e errhead@getalby.com) or the pubkey of a lightning node<br><label for="split">Split Percentage:</label><input class="form-control d-block ng-pristine ng-valid ng-touched"  type="text" id="modal-split-value" value="1"><br>
          <label for="address">Lightning Address:</label><input class="form-control d-block ng-pristine ng-valid ng-touched"  type="text" id="modal-split-address"><br>
          <button class="peertube-button orange-button ng-star-inserted" id="add-split-final">Add New Split</button>`;
          let addFinalButton = document.getElementById("add-split-final")
          if (addFinalButton) {
            addFinalButton.onclick = async function () {
              await doAddSplit(channel);
            }
          }
          let optionBox = document.getElementById("names");
          if (optionBox){
            optionBox.addEventListener('change', async function() {
              //console.log("⚡️ changed value",this.value);
              document.getElementById("modal-split-name").value = this.value;
              let dude = await getLightningAddress(this.value);
              document.getElementById("modal-split-address").value = dude.address;
            })
          } else {
            console.log("⚡️ unable to link optionbox");
          }
        }
      }
      //console.log("⚡️split data for making buttons",splitData);
      for (var slot in splitData) {
        //console.log("⚡️iterating slot",slot)
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
            await assignSplitEditButtons(splitData, editSlot, channel, ks);
          }
        }
      }
    }

  }
  async function doUpdateSplit(channel, slot, ks) {
    if (debugEnabled) {
      console.log("⚡️Do update split", channel, slot, ks);
    }
    let newSplit = document.getElementById("modal-split-value").value;
    let newAddress = document.getElementById("modal-split-address").value;
    let newName = encodeURI(document.getElementById("modal-split-name").value);
    let customKeysend = document.getElementById("manualkeysend").checked
    if (debugEnabled) {
      console.log("⚡️New values from split dialog", customKeysend, newName, newAddress, newSplit, slot, ks);
    }
    if (ks) {
      var pubKey = document.getElementById("modal-split-pubkey").value
      var customKey = document.getElementById("modal-split-customkey").value
      var customValue = document.getElementById("modal-split-customvalue").value
    } else {
      var pubKey, customKey, customValue;
    }
    let updateApi = `/updatesplit?channel=` + channel + `&split=` + newSplit + `&splitaddress=` + newAddress + `&slot=` + slot;
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
    }
    let updateResult;
    try {
      updateResult = await axios.get(basePath + updateApi);
      await closeModal();
      notifier.success("updated " + channel + " splits");
      return updateResult.data;
    } catch {
      console.log("⚡️unable to update split\n", updateApi);
      notifier.error("unable to update splits for " + channel);
      return;
    }
  }
  async function doRemoveSplit(channel, slot) {
    let removeApi = `/removesplit?channel=` + channel + `&slot=` + slot;
    let removeResult;
    try {
      removeResult = await axios.get(basePath + removeApi);
      await closeModal();
      let newPanel = await getConfigPanel(removeResult.data, channel);
      let channelUpdate = document.getElementsByClassName("form-group");
      channelUpdate[0].removeChild(panelHack)
      channelUpdate[0].appendChild(newPanel);
      panelHack = newPanel;
      notifier.success("Removed split");
      return removeResult.data;
    } catch {
      console.log("⚡️unable to remove split\n", removeApi);
      notifier.error("unable to remove split");
      return;
    }
  }
  async function doAddSplit(channel) {
    if (debugEnabled) {
      console.log("⚡️do add split called with ", channel);
    }
    let addApi;
    let newSplit = document.getElementById("modal-split-value").value;
    let newName = document.getElementById('modal-split-name').value;
    let newAddress = document.getElementById("modal-split-address").value;
    if (newAddress.length == 66) {
      let node = newAddress;
      newAddress = "custom"
      addApi = `/addsplit?channel=` + channel + `&split=` + newSplit + `&splitaddress=` + newAddress + '&name=' + newName;
      addApi = addApi + `&customkeysend=true&node=` + node + ``
    } else if (newAddress.indexOf("@") > 1) {
      addApi = `/addsplit?channel=` + channel + `&split=` + newSplit + `&splitaddress=` + newAddress + '&name=' + newName;;
    } else {
      console.log("⚡️unable to add malformed split address", newAddress);
      notifier.error("Lightning address is neither an address or a valid server pubkey");
      return;
    }
    let addResult;
    if (debugEnabled) {
      console.log("⚡️attempting add split to channel", addApi);
    }
    try {
      addResult = await axios.get(basePath + addApi);
    } catch (e) {
      console.log("⚡️unable to add split\n", addApi, addResult);
      notifier.error(e);
      return;
    }
    if (addResult) {
      await closeModal();
      let newPanel = await getConfigPanel(addResult.data, channel);
      let channelUpdate = document.getElementsByClassName("form-group");
      channelUpdate[0].removeChild(panelHack)
      channelUpdate[0].appendChild(newPanel);
      panelHack = newPanel
      await assignEditButtons(addResult.data, channel);
      notifier.success("split added to " + channel);
      return addResult.data;
    } else {
      await closeModal();
      notifier.error("failed to add split to " + channel);
      return;
    }
  }
  async function makeKeysendHtml(splitData, slot, ks) {
    if (debugEnabled) {
      console.log("⚡️making keysend edit panel", slot, ks);
    }
    let html;
    html = `<label for="name">Split Name:</label><input class="form-control d-block ng-pristine ng-valid ng-touched"  type="text" id="modal-split-name" value="` + splitData[slot].name + `"><br>`;
    if (slot == 0) {
      html = html + `<label for="split">Split Percentage:</label><input class="form-control d-block ng-pristine ng-valid ng-touched"  type="text" id="modal-split-value" readonly value="` + splitData[slot].split + `"><br>`;
    } else {
      html = html + `<label for="split">Split Percentage:</label><input class="form-control d-block ng-pristine ng-valid ng-touched"  type="text" id="modal-split-value" value="` + splitData[slot].split + `"><br>`;
    }
    // html = html + "Enter lightning address (i.e errhead@getalby.com) or the pubkey of a lightning node<br>";

    if (ks) {
      html = html + `<label for="address">Lightning Address:</label><input class="form-control d-block ng-pristine ng-valid ng-touched"  type="text" id="modal-split-address" readonly value ="` + splitData[slot].address + `"><br>`;
    } else {
      html = html + `<label for="address">Lightning Address:</label><input class="form-control d-block ng-pristine ng-valid ng-touched"  type="text" id="modal-split-address" value ="` + splitData[slot].address + `"><br>`;
    }
    let customKey, customValue, status, pubKey;
    html = html + `<hr>  <input type="checkbox" id="manualkeysend" name="manualkeysend">`;
    html = html + `<label for="manualkeysend"> Custom Keysend Configuration</label><br>`;
    if (splitData[slot].keysend) {
      status = splitData[slot].keysend.status;
      pubKey = splitData[slot].keysend.pubkey;
      if (splitData[slot].keysend.customData && splitData[slot].keysend.customData[0]) {
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
      html = html + `<label for="address">Keysend pubkey:</label><input class="form-control d-block ng-pristine ng-valid ng-touched"  type="text" id="modal-split-pubkey" value ="` + pubKey + `">`;
      html = html + `<br><label for="address">Custom Key:</label><input class="form-control d-block ng-pristine ng-valid ng-touched"  type="text" id="modal-split-customkey" value ="` + customKey + `">`;
      html = html + `<br><label for="address">Custom Value:</label><input class="form-control d-block ng-pristine ng-valid ng-touched"  type="text" id="modal-split-customvalue" value ="` + customValue + `">`;
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
  async function getChannelGuid(channel) {
    let guid;
    let guidApi = basePath + "/getchannelguid?channel=" + channel;
    try {
      guid = await axios.get(guidApi);
      if (guid) {
        if (debugEnabled) {
          console.log("⚡️guid from guid api", guid)
        }
        return guid.data;
      }
    } catch (err) {
      console.log("⚡️error getting channel guid", guidApi, err)
    }
    return;
  }
  async function getPodData(channel) {
    let freshPodData;
    let podApi = basePath + "/getpoddata?channel=" + channel;
    try {
      freshPodData = await axios.get(podApi);
      if (freshPodData) {
        return freshPodData.data;
      }
    } catch (err) {
      console.log("⚡️error getting pod Data", podApi, err)
    }

    return;
  }
  async function getDirectoryHtml(){
    let html = `<label for="Support V4V">Select Splitter:</label><select id="names" name="names">`;
    for (var dude of await getLightningAddress() ){
      html = html + `<option value="${dude.name}">${dude.name}</option>`;
    }
    html = html + `</select>`;
    return html;
  }
  async function getTimePeriodsHtml(){
    let html = `<label for="times">Patronage frequency:</label><select id="times" name="times">`;
    let times = ["Daily","Weekly","Monthly","Yearly"]
    for (var time of times){
      html = html + `<option value="${time}">${time}</option>`;
    }
    html = html + `</select>`;
    return html;
  }
  async function getPatronLevels(fullChannel){
    let html = `<label for="patronage-level">Patronage level:</label><select id="patron-level" name="patron-level">`;
    console.log("patronage",channelName,channelId,fullChannel);
    let levelsApi = basePath + `/getpatronlevels?channel=${fullChannel}`;
    let levels,levelsData;
    try {
      levelsData = await axios.get(levelsApi);
    } catch(e) {
      console.log ("error getting patron rules for",fullChannel,e)
    }
    if (levelsData && levelsData.data){
      levels = levelsData.data;
    } else {
      levels = await getDefaultPatronLevels();
    }
    for (var level of levels){
      html = html + `<option value="${level.sats}">${level.name}</option>`;
    }
    html = html + `</select>`;
    return html;
  }
  async function getDefaultPatronLevels(){
    return [
      {"name" :"Basic Patron","sats":69},
      {"name":"Freedon Patron","sats":1776},
      {"name":"BooB Patron","sats":8008},
      {"name":"Meme Patron","sats":42069},
      {"name":"Big Baller Patron","sats":100000}
    ]
  }
  async function getLightningAddress(name){
    let directory=[{ name: "Services and developers",address: "" },
      { name: "Podcast Index",
        address: "03ae9f91a0cb8ff43840e3c322c4c61f019d8c1c3cea15a25cfc425ac605e61a4a" },
      { name: "BoostBot",
        address: "03d55f4d4c870577e98ac56605a54c5ed20c8897e41197a068fd61bdb580efaa67" },
      { name: "err head (PeerTube Dev)",
        address: "errhead@getalby.com" },
      { name: "Alecks Gates (PeerTube & PodPing Dev)",
        address: "02b66d7caae1acb51a95e036fc12b1e6837d9143141fcff520876b04b9d82f36d1" },
      { name: "Brian of London (Hive and PodPing Dev)",
        address: "brianoflondon@v4v.app" },
      { name: "Dave Jones (Pod Sage)",
        address: "dave@getalby.com" },
      { name: "Steven Crader (Podcastindex Dev)",
        address: "stevencrader@getalby.com" },
      { name: "Steven Bell (LNBeats Sovereign Feeds Music Side Project CurioCaster Dev)",
        address: "steven@getalby.com" }, 
      { name: "Martin Mouritzen (Podfriend Dev)",
        address: "podfriend@getalby.com" }, 
    ]
    if (name){
      for (var dude of directory){
        if (dude.name == name){
          return dude;
        }
      }
    } else {
      return directory;
    }
  }
  async function makeValueSettings(){
    if (debugEnabled) {
      console.log("⚡️making value settings",v4vSettings,accountAddress);
    }
    if (!v4vSettings){
      await loadV4vSettings();
    }
    let displayAddress=accountAddress
    if (displayAddress == undefined){
      displayAddress = "";
    }
    let replyDescription = `Lightning address for boostbacks and cross app zaps. Works best with an address that supports keysend, which is currently <a href="https://getalby.com/podcast-wallet" target="_blank" rel="noopener noreferrer">Alby</a>, <a href="http://signup.hive.io/" target="_blank" rel="noopener noreferrer">Hive</a>, or <a href="https://support.fountain.fm/category/51-your-account-wallet" target="_blank" rel="noopener noreferrer">Fountain</a>`
    let authorizeDescription = `Authorize Alby Wallet for easy payments without needing a browser extension`
    let streamStateDescription = `Stream channels that have a V4V split configured`
    let streamAmountDescription = `Amount of sats to stream every minute of content. Dollar equivelency will change over time.`
    let boostAmountDescription = `Amount of SATS for ${tipVerb}`
    let fromDescription = `Name to use when sending SATs`
    if (debugEnabled){
      console.log("settings when making page",v4vSettings,accountAddress,boostFrom,boostAmount,streamEnabled,streamAmount);
    }
    let html = `<div id="v4v-settings"><center><h1>Value 4 Value Settings</h1></center><table>
      <tr><td><h4>Wallet</h4><td><td><b>Configure lightning wallets</b></td></tr>
      <tr><td><td>BoostBack:<td><input class="form-control d-block ng-pristine ng-valid ng-touched" type="text" id="v4v-boost-back" name="v4v-boost-back" value="${displayAddress}">
      </td><td>${replyDescription}
      </tr><tr>
      <td><td><td><button id = "v4v-wallet-authorize" class="peertube-button orange-button ng-star-inserted">Authorize Payments</button>
      <td>${authorizeDescription}</td></tr>
      </td></tr><tr><td><h4>Boost</h4><td><td><b>Send sats to creators with a message</b></td></tr>
      <td><td>default name:<td><input type="text" class="form-control d-block ng-pristine ng-valid ng-touched" id="v4v-boost-name" value="${boostFrom}">
      <td>${fromDescription}</td></tr>
      <tr><td><td>Default Boost:<td><input type="text" " id="v4v-def-boost-amount" value="${boostAmount}" size="6"> Currently worth 
      $<input type="text" class="ng-untouched ng-pristine ng-invalid" id="v4v-def-boost-cash" disabled value="`+ (boostAmount * convertRate).toFixed(2) + `" size="6">
      <td>${boostAmountDescription}
      </td><tr><td><h4>Streaming</h4><td><td><b>Stream sats for every minute watched</b></td></tr><td>
      <td><td><input type="checkbox" id="v4v-stream-auto" name="v4v-stream-auto" value="streamsats"> Stream Automatically
      <td>${streamStateDescription}
      </tr><tr>
      <td><td>Stream Amount:<td><input type="text" class="form-control d-block ng-pristine ng-valid ng-touched" id="v4v-stream-amount" name="v4v-stream-amount" value="${streamAmount}" size="6"> Currently worth  
      $<input type="text" class="ng-untouched ng-pristine ng-invalid" disabled id="v4v-stream-cash" name="v4v-stream-cash" value="`+ (streamAmount * convertRate).toFixed(2) + `" size="6">
      <td>${streamAmountDescription}
      </tr><tr>

    </td><tr><td><h4>Patronage</h4><td><td><b>Send recurring SATs to creators</b></td></tr><td><td>`;
    let subApi=basePath + `/getsubscriptions`;
    try {
      //console.log("⚡️trying to get subscription",subApi);
      let subscribed = await axios.get( subApi, { headers: await peertubeHelpers.getAuthHeader() });
      //console.log("⚡️subscription result",subscribed);
      if (subscribed && subscribed.data) {
        //console.log("⚡️subscribed ",subscribed.data);
        //html = html + "<h2>Patronage</h2>"
        for (var sub of subscribed.data){
          let startDate= new Date(sub.startdate).toLocaleDateString()
          let endDate = new Date(sub.startdate+(milliday*sub.paiddays)).toLocaleDateString();
          let link = "https://"+window.location.hostname+"/c/"+sub.channel;
          html = html+ `<tr><td><td><td><a href=${link}>${sub.channel}</a> <td>${startDate} to ${endDate}, ${sub.paiddays} days</td></tr><td><td>`;
        }
        
      } else {
        console.log("⚡️didn't get good subscription data");
      }
    } catch (err) {
        console.log("⚡️error attempting to get subscribed status", subApi, err);
    }
    html=html+`</td></tr></table><p style="text-align:right;"><button id = "v4v-settings-update" class="peertube-button orange-button ng-star-inserted">Update</button></p></div>`;
    html = html +`<button id = "v4v-show-boosts" class="peertube-button orange-button ng-star-inserted">Show Boosts</button>
                  <input type="checkbox" id="v4v-invoice-in"> In
                  <input type="checkbox" id="v4v-invoice-out" > out
                  <input type="checkbox" id="v4v-invoice-stream"> Stream
                  <input type="checkbox" id="v4v-invoice-boost"> Boost
                  <input type="checkbox" id="v4v-invoice-auto"> Auto`
    return html;
  }
  async function loadV4vSettings(){
    if (debugEnabled){
      console.log("v4v initial settings",v4vSettings,accountAddress,streamAmount,boostAmount,boostFrom);
    }
    if (!v4vSettings){
      if (debugEnabled){
        console.log("⚡️ no v4v settings found, going to load ");
      }
      let settingsApi = basePath + `/getv4v`;
      try {
        v4vSettings = await axios.get(settingsApi,{ headers: await peertubeHelpers.getAuthHeader() });
        v4vSettings = v4vSettings.data;
      } catch (e){
        console.log("⚡️ Hard error gettings v4v settings ",settingsApi,e);
      }
    } else if (debugEnabled) {
      console.log("⚡️ v4v settings found ",v4vSettings,accountAddress);
    }
    if (v4vSettings){
      boostAmount = v4vSettings.boostAmount;
      streamAmount = v4vSettings.streamAmount;
      boostFrom = v4vSettings.boostFrom;
      streamEnabled = v4vSettings.streamAuto;
      accountAddress = v4vSettings.boostBack;
    }
    if (debugEnabled){
      console.log("v4v final settings",v4vSettings,accountAddress,streamAmount,boostAmount,boostFrom);
    }
  }
}
export {
  register
}

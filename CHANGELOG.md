v 0.3.0
- added support buttons for links to tipeeestream or streamlabs found in channel/video description/support
v 0.2.9
- Added cross app comment support to podcast RSS feed
v 0.2.8
- added storage of keysend data to allow custom configuration and cut down network traffic

v 0.2.7
- changed episode guid to the item url instead of the actual guid to match spec
- added <podcast:guid> value to podcast2 rss feed.
- fixed guid to match spec format
- fixed customkey to work properly
- added server routes to store/retrieve channel guid and full split wallet data

v 0.2.6
- Dynamically fetch bitcoin conversion rate in client

v 0.2.5
- Fixed issue with mobile wallet browsers support webln but not keysend
- Verified now working fully with Blixt wallet

v0.2.4
- fixed buttons to use channel display name instead of name
- cleaned up no webln provider dialogs

v0.2.3
- cleaned up initial variable assignment block
- disabled remnants of left side tip option
- moved html generation into discrete functions to ease collaboration.

v0.2.2
- added QR code and LNURL paste fallback option if webLN.enable fails.

v0.2.1
- fixed error where tip button wasn't being removed for non-wallet creators.
- removed confirm and maybe later buttons from support dialogs

v0.2.0
Beta 1 release candidate 1

- Fixed visual irregularities with dynamic changes to streaming amount. Added visual update for changed values from left menu.
- added basic wallet and rss feed info to channel update interface as well as ability to specify podcast index feed id for interoperability.

v0.1.9

- created changelog
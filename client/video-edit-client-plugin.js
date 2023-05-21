function register({ registerHook }) {
    registerHook({
        target: 'action:video-edit.init',
        handler: async ({ video1,video2,video3 }) => {
            console.log("video edit",video1,video2,video3);
        }
    })
}
export {
    register
}

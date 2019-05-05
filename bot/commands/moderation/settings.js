module.exports.load = client => {
    client.commands['settings'] = {
        settings : {
            type : 'moderation',
            description : 'test',
            usage : `${client.settings.prefix}test`
        },

        async run(message) {
            
        }
    }
}
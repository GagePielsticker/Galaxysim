module.exports.load = client => {
    client.commands['settings'] = {
        settings : {
            type : 'moderation',
            description : 'test',
            usage : `${client.settings.prefix}settings welcomes {on/off}
            ${client.settings.prefix}settings leaves {on/off}
            ${client.settings.prefix}settings welcome_message {string}
            ${client.settings.prefix}settings leave_message {string}
            ${client.settings.prefix}settings welcome_channel {<#channel_id>}
            ${client.settings.prefix}settings leave_channel {<#channel_id>}
            ${client.settings.prefix}settings chatlog {on/off}
            ${client.settings.prefix}settings chatlog_channel {<#channel_id>}
            ${client.settings.prefix}settings autorole {on/off}
            ${client.settings.prefix}settings autorole_role {<@role_id>}`
        },

        async run(message) {
            
        }
    }
}
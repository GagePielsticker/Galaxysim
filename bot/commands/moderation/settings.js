module.exports.load = client => {
    client.commands['settings'] = {
        settings : {
            type : 'moderation',
            description : 'Usefull settings to help moderate your server.',
            usage : `${client.settings.prefix}settings welcomes {on/off}
${client.settings.prefix}settings leaves {on/off}
${client.settings.prefix}settings welcome_message {string}
${client.settings.prefix}settings leave_message {string}
${client.settings.prefix}settings welcome_channel {<#channel_id>}
${client.settings.prefix}settings leave_channel {<#channel_id>}
${client.settings.prefix}settings chatlog {on/off}
${client.settings.prefix}settings chatlog_channel {<#channel_id>}
${client.settings.prefix}settings autorole {on/off}
${client.settings.prefix}settings autorole_role {<@role_id>}

Note: For welcome and leave messages, put in {user} for user mention in the message.`
        },

        async run(message) {
            let args = message.content.split(' ').splice(1)

            //welcome toggles
            if(args[0] == 'welcomes') {
                let tog = null
                if(args[1] == 'on') tog = true
                if(args[1] == 'off') tog = false
                if(tog == null) return client.sendError(message, 'Invalid toggle.')
                client.moderation.settings.welcomeToggle(message.guild.id, tog, message.author.id)
                .then(() => client.sendSuccess(message, 'Successfully updated setting.'))
                .catch(e => client.sendError(message, e))
            }

            //welcome messages
            if(args[0] == 'welcome_message') {
                let string = args.splice(1).join(' ')
                if(string == '') return client.sendError(message, 'Invalid string.')
                client.moderation.settings.welcomeMessage(message.guild.id, string, message.author.id)
                .then(() => client.sendSuccess(message, 'Successfully updated setting.'))
                .catch(e => client.sendError(message, e))
            }

            //welcome channel
            if(args[0] == 'welcome_channel') {
                let channel = args[1].replace(/[<#!>]/g, '')
                if(channel == '') return client.sendError(message, 'Invalid channel.')
                message.guild.channels.get(channel)
                .then(chan => {
                    client.moderation.settings.welcomeChannel(message.guild.id, channel, message.author.id)
                    .then(() => client.sendSuccess(message, 'Successfully udpated settings.'))
                    .catch(e => client.sendError(message, e))
                })
                .catch(() => client.sendError(message, 'That channel doe\'s not exist.'))
            }

            //leave toggles
            if(args[0] == 'leaves') {
                let tog = null
                if(args[1] == 'on') tog = true
                if(args[1] == 'off') tog = false
                if(tog == null) return client.sendError(message, 'Invalid toggle.')
                client.moderation.settings.leaveToggle(message.guild.id, tog, message.author.id)
                .then(() => client.sendSuccess(message, 'Successfully updated setting.'))
                .catch(e => client.sendError(message, e))
            }

            //leave messages
            if(args[0] == 'leave_message') {
                let string = args.splice(1).join(' ')
                if(string == '') return client.sendError(message, 'Invalid string.')
                client.moderation.settings.welcomeMessage(message.guild.id, string, message.author.id)
                .then(() => client.sendSuccess(message, 'Successfully updated setting.'))
                .catch(e => client.sendError(message, e))
            }

            //set leave channel
            if(args[0] == 'leave_channel') {
                let channel = args[1].replace(/[<#!>]/g, '')
                if(channel == '') return client.sendError(message, 'Invalid channel.')
                message.guild.channels.get(channel)
                .then(chan => {
                    client.moderation.settings.leaveChannel(message.guild.id, channel, message.author.id)
                    .then(() => client.sendSuccess(message, 'Successfully udpated settings.'))
                    .catch(e => client.sendError(message, e))
                })
                .catch(() => client.sendError(message, 'That channel doe\'s not exist.'))
            }

            //chatlog toggles
            if(args[0] == 'chatlog') {
                let tog = null
                if(args[1] == 'on') tog = true
                if(args[1] == 'off') tog = false
                if(tog == null) return client.sendError(message, 'Invalid toggle.')
                client.moderation.settings.chatLogToggle(message.guild.id, tog, message.author.id)
                .then(() => client.sendSuccess(message, 'Successfully updated setting.'))
                .catch(e => client.sendError(message, e))
            }

            //set chatlog channel
            if(args[0] == 'chatlog_channel') {
                let channel = args[1].replace(/[<#!>]/g, '')
                if(channel == '') return client.sendError(message, 'Invalid channel.')
                message.guild.channels.get(channel)
                .then(chan => {
                    client.moderation.settings.chatLogChannel(message.guild.id, channel, message.author.id)
                    .then(() => client.sendSuccess(message, 'Successfully udpated settings.'))
                    .catch(e => client.sendError(message, e))
                })
                .catch(() => client.sendError(message, 'That channel doe\'s not exist.'))
            }

            //autorole toggles
            if(args[0] == 'autorole') {
                let tog = null
                if(args[1] == 'on') tog = true
                if(args[1] == 'off') tog = false
                if(tog == null) return client.sendError(message, 'Invalid toggle.')
                client.moderation.settings.autoRoleToggle(message.guild.id, tog, message.author.id)
                .then(() => {
                    let output = 'Successfully updated setting.'
                    if(!client.moderation.hasPerm(message.guild.id, client.user.id, 'MANAGE_ROLES')) output += '\nWarning: Bot does not have \`MANAGE_ROLES\` permission.'
                    client.sendSuccess(message, output)
                })
                .catch(e => client.sendError(message, e))
            }

            //autorole role setting
            if(args[0] == 'autorole_role') {
                let role = args[1].replace(/[<@!>]/g, '')
                if(role == '') return client.sendError(message, 'Invalid role.')
                message.guild.roles.get(role)
                .then(() => {
                    client.moderation.settings.autoRoleRole(message.guild.id, role, message.author.id)
                    .then(() => client.sendSuccess(message, 'Successfully updated setting.'))
                    .catch(e => client.sendError(message, e))
                })
                .catch(() => client.sendError(message, 'Role doen\'t exist in guild.'))
            }
        }
    }
}
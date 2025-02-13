import axios from 'axios';
import 'dotenv/config';
import { APP_ID, DISCORD_TOKEN } from './app';

export async function DiscordRequest(
	endpoint: string,
	options: { method: string; data?: any }
) {
	try {
		// append endpoint to root API URL
		const url = 'https://discord.com/api/v10/' + endpoint;
		const res = await axios(url, {
			headers: {
				Authorization: `Bot ${DISCORD_TOKEN}`,
				'Content-Type': 'application/json; charset=UTF-8',
			},
			...options,
		});
		return res;
	} catch (error) {
		console.log(error);
		throw error;
	}
}

export async function InstallGlobalCommands(commands: any) {
	// API endpoint to overwrite global commands
	const endpoint = `applications/${APP_ID}/commands`;
	try {
		// This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
		await DiscordRequest(endpoint, {
			method: 'PUT',
			data: commands,
		});
	} catch (err) {
		console.error(err);
	}
}

export async function deferResponse(
	token: string,
	userId: string,
	url: string,
	commentsDepth?: number
): Promise<void> {
	try {
		// request screenshot from API
		// send folloup response
		// send dm to user?
	} catch (err) {
		console.error(err);
		throw err;
	}
}

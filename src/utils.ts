import axios, { AxiosError, AxiosResponse } from 'axios';
import 'dotenv/config';
import { API_URI, APP_ID, DISCORD_TOKEN } from './app';
import { ScreenshotData, User } from './types';

export async function DiscordRequest(
	endpoint: string,
	options: { method: string; data?: any }
) {
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
	} catch (error: unknown) {
		console.error(error);
	}
}

export async function deferScreenshotItRes(
	token: string,
	user: User,
	context: number,
	url: string,
	commentsDepth?: number,
	nitter?: boolean
): Promise<void> {
	try {
		const data = await requestScreenshot(url, user.id, commentsDepth, nitter);
		const message = formatMessage(data);
		if (context === 0) {
			sendFollowupRes(token, message);
			sendDMToUser(user.id, message);
		} else {
			sendFollowupRes(token, message);
		}
	} catch (error: unknown) {
		errorHandle(token, error);
	}
}

export async function deferMostRecentScreenshotRes(
	token: string,
	user: User,
	context: number,
	social?: string
): Promise<void> {
	try {
		const data = await getMostRecentScreenshot(user.id, social);
		const message = formatMessage(data);
		if (context === 0) {
			sendFollowupRes(token, message);
			sendDMToUser(user.id, message);
		} else {
			sendFollowupRes(token, message);
		}
	} catch (error: unknown) {
		errorHandle(token, error);
	}
}

export async function deferDeleteMostRecentScreenshotRes(
	token: string,
	user: User,
	context: number,
	social?: string
): Promise<void> {
	try {
		const res = await deleteMostRecentScreenshot(user.id, social);
		res.url = 'Deleted';
		const message = formatMessage(res);
		if (context === 0) {
			sendFollowupRes(token, message);
			sendDMToUser(user.id, message);
		} else {
			sendFollowupRes(token, message);
		}
	} catch (error: unknown) {
		errorHandle(token, error);
	}
}

export async function requestScreenshot(
	url: string,
	userId: string,
	commentsDepth?: number,
	nitter?: boolean
): Promise<ScreenshotData> {
	const hostname = new URL(url).hostname.replace('www.', '');
	let service = hostname.slice(0, hostname.lastIndexOf('.'));
	if (service === 'x') {
		service = 'twitter';
	}
	const resAPI: AxiosResponse<ScreenshotData> = await axios.post(
		`${API_URI}/screenshot/${service}`,
		{
			postUrl: url,
			commentsDepth: commentsDepth || 0,
			nitter: nitter || false,
			discordId: userId,
		},
		{ headers: { 'Content-Type': 'application/json' } }
	);
	return resAPI.data;
}

export async function getMostRecentScreenshot(
	userId: string,
	social?: string
): Promise<ScreenshotData> {
	const resAPI: AxiosResponse<ScreenshotData> = await axios.post(
		`${API_URI}/user/recent-screenshot`,
		{ discordId: userId, social: social },
		{ headers: { 'Content-Type': 'application/json' } }
	);
	return resAPI.data;
}

export async function deleteMostRecentScreenshot(
	userId: string,
	social?: string
): Promise<ScreenshotData> {
	const resAPI: AxiosResponse<ScreenshotData> = await axios.delete(
		`${API_URI}/user/recent-screenshot`,
		{
			data: { discordId: userId, social: social },
			headers: { 'Content-Type': 'application/json' },
		}
	);
	return resAPI.data;
}

export async function sendFollowupRes(
	token: string,
	message: string
): Promise<void> {
	const endpoint = `webhooks/${APP_ID}/${token}/messages/@original`;
	await DiscordRequest(endpoint, {
		method: 'PATCH',
		data: { content: message },
	});
}

export async function sendDMToUser(
	userId: string,
	message: string
): Promise<void> {
	const channelId = await createDMChannelWithUser(userId);
	const endpoint = `channels/${channelId}/messages`;
	await DiscordRequest(endpoint, {
		method: 'POST',
		data: { content: message },
	});
}

export async function createDMChannelWithUser(userId: string): Promise<string> {
	const endpoint = `users/@me/channels`;
	const res = await DiscordRequest(endpoint, {
		method: 'POST',
		data: { recipient_id: userId },
	});
	return res.data.id;
}

function formatMessage(data: ScreenshotData): string {
	const date = new Date(data.timestamp).toLocaleDateString('en-GB', {
		weekday: 'short',
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		fractionalSecondDigits: 3,
		hour12: false,
	});
	return `${data.url} ${data.service} ${data.userHandle} ${date}`;
}

function errorHandle(token: string, error: unknown): void {
	if (error instanceof AxiosError) {
		console.error(error.response);
		sendFollowupRes(
			token,
			error.response?.data.message || 'Error getting data.'
		);
	} else {
		console.error(error);
		sendFollowupRes(
			token,
			// @ts-expect-error
			error?.message || 'Error getting data.'
		);
	}
}

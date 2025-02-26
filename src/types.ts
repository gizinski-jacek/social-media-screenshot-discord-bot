export interface Member {
	user?: User;
	nick?: string;
	avatar?: string;
	banner?: string;
	roles: string[];
	joined_at: string;
	premium_since?: string;
	deaf: boolean;
	mute: boolean;
	flags: number;
	pending?: boolean;
	permissions?: string;
	communication_disabled_until?: string;
	avatar_decoration_data?: {
		asset: string;
		sku_id: string;
	};
}

export interface User {
	id: string;
	username: string;
	discriminator: string;
	global_name: string;
	avatar: string;
	bot?: boolean;
	system?: boolean;
	mfa_enabled?: boolean;
	banner?: string;
	accent_color?: number;
	locale?: string;
	verified?: boolean;
	email?: string;
	flags?: number;
	premium_type?: number;
	public_flags?: number;
	avatar_decoration_data?: {
		asset: string;
		sku_id: string;
	};
}

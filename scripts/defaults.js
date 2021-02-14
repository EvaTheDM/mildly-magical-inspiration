export const MODULE = 'mmi'
export const MOD_PATH = 'modules/mmi';
export const TEMPLATE_PATH = `${ MOD_PATH }/templates`;
export const IMG_PATH = `${ MOD_PATH }/img`;

export const USER_ROLE_CHOICES = Object.entries(CONST.USER_ROLES)
	.filter(([key, val]) => val !== 0)
	.reduce((choices, [permission, val]) => {
		choices[val] = permission;
		return choices;
	}, {});
export default {
	get module() { return `mmi` },
	get modPath() { return `modules/${this.module}` },
	get templatePath() { return `${this.modPath}/templates` },
	get imagePath() { return `${this.modPath}/img` },
	get userRoles() {
		const roles = duplicate(CONST.USER_ROLE_NAMES);
		delete roles[0];
		delete roles[4];
		return roles
	}
}
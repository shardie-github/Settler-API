/**
 * Create User Command
 * CQRS Command for creating a new user
 */
export interface CreateUserCommand {
    email: string;
    password: string;
    name?: string;
    role?: string;
    dataResidencyRegion?: string;
}
export interface CreateUserCommandResult {
    userId: string;
    email: string;
}
//# sourceMappingURL=CreateUserCommand.d.ts.map
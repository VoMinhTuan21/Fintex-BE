import * as bcrypt from 'bcrypt';
const saltRounds = 10;

export const hashPasswords = (password: string): string => {
    return bcrypt.hashSync(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};

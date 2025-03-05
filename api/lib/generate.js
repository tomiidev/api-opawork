import { v4 as uuidv4 } from "uuid";

export const generatePassword = () => {
    return `Psyc2024!${uuidv4().slice(0, 6)}`;
};

import { IResponsePost } from '../types/post';

export const comparePost = (postA: IResponsePost, postB: IResponsePost) => {
    const createTimeA = new Date(postA.createdAt);
    const createTimeB = new Date(postB.createdAt);
    if (createTimeA < createTimeB) {
        return 1;
    }
    if (createTimeA > createTimeB) {
        return -1;
    }
    return 0;
};

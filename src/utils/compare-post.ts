import { IResPost } from '../types/post';

export const comparePost = (postA: IResPost, postB: IResPost) => {
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

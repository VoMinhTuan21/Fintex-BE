export const handleFriendOnline = (onlineUsers: OnlineUser[], friendIds: string[]) => {
    return onlineUsers.filter((item) => friendIds.includes(item._id.toString()));
};

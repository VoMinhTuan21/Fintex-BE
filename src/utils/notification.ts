export const handlePostNotiContent = (type: string) => {
    switch (type) {
        case 'createPost':
            return 'đã đăng bài post mới';
        case 'commentPost':
            return 'đã bình luận bài post của bạn';
        case 'reactionPost':
            return 'đã thả cảm xúc cho bài post của bạn';
        case 'reactionComment':
            return 'đã thả cảm xúc cho bình luận của bạn';
        case 'replyComment':
            return 'đã trả lời bình luận của bạn';
        default:
            return null;
    }
};

export const handleFriendReqNotiContent = (type: string) => {
    switch (type) {
        case 'createFriendReq':
            return 'đã gửi lời mời kết bạn';
        case 'acceptFriendReq':
            return 'đã chấp nhận lời mời kết bạn';
        case 'deleteFriend':
            return 'đã hủy kết bạn với bạn';
        default:
            return null;
    }
};

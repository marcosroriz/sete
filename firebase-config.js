{
    "rules": {
        "users": {
            "$uid": {
                ".read": "auth != null && auth.uid == $uid",
                ".write": "auth != null && auth.uid == $uid"
            }
        },
        "data": {
            "$uid": {
                ".read": "auth != null && auth.uid == $uid",
                ".write": "auth != null && auth.uid == $uid"
            }
        }
    }
}

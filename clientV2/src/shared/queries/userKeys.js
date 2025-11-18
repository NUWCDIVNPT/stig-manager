export const userKeys = {
  me: () => ['user'],
  webPreferences: () => ['user', 'web-preferences'],

  all: () => ['users'],
  detail: userId => [...userKeys.all(), userId],

  groups: () => ['user-groups'],
  groupDetail: userGroupId => [...userKeys.groups(), userGroupId],
}

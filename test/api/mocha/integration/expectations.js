// only used in revision pinning 
export const expectations = {
  stigmanadmin: {
    user: 'admin',
    userId: '1',
    grant: 'admin',
    validStigs: ['VPN_SRG_TEST', 'Windows_10_STIG_TEST'],
    pinnedRevStr: 'V1R0',
    canElevate: true,
    pinnedState: true,
    canCreateCollection: true,
    canDeleteCollection: true,
    canModifyCollection: true
  },
  lvl1: {
    user: 'lvl1',
    userId: '85',
    grant: 'restricted',
    validStigs: ['VPN_SRG_TEST','Windows_10_STIG_TEST'],
    pinnedRevStr: 'V1R1',
    canElevate: false,
    pinnedState: false,
    canCreateCollection: false,
    canDeleteCollection: false,
    canModifyCollection: false
  },
  lvl2: {
    user: 'lvl2',
    userId: '21',
    grant: 'lvl2',
    validStigs: ['VPN_SRG_TEST', 'Windows_10_STIG_TEST'],
    pinnedRevStr: 'V1R1',
    canElevate: false,
    pinnedState: false,
    canCreateCollection: false,
    canDeleteCollection: false,
    canModifyCollection: false
  },
  lvl3: {
    user: 'lvl3',
    userId: '44',
    grant: 'lvl3',
    validStigs: ['VPN_SRG_TEST', 'Windows_10_STIG_TEST'],
    pinnedRevStr: 'V1R0',
    canElevate: false,
    pinnedState: true,
    canCreateCollection: false,
    canDeleteCollection: false,
    canModifyCollection: true
  },
  lvl4: {
    user: 'lvl4',
    userId: '45',
    grant: 'lvl4',
    validStigs: ['VPN_SRG_TEST', 'Windows_10_STIG_TEST'],
    pinnedRevStr: 'V1R0',
    pinnedState: true,
    canCreateCollection: false,
    canDeleteCollection: true,
    canModifyCollection: true
  },
  collectioncreator: {
    user: 'collectioncreator',
    userId: '82',
    grant: 'none',
    validStigs: [],
    canCreateCollection: true,
    canDeleteCollection: false,
    canModifyCollection: false
  }
}

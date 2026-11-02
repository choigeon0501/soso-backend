export enum ReviewReportType {
  /** 관련 없는 후기입니다. */
  IRRELEVANT = 'irrelevant',
  /** 음란, 욕설 등 부적절한 내용입니다. */
  ABUSIVE = 'abusive',
  /** 개인정보를 노출했습니다. */
  PERSONAL_INFO = 'personal_info',
  /** 홍보 및 광고 후기입니다. */
  ADVERTISEMENT = 'advertisement',
  /** 같은 내용을 도배하였습니다. */
  DUPLICATE = 'duplicate',
  /** 기타 */
  OTHER = 'other',
}

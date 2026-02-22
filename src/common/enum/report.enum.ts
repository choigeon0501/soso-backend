export enum ShopReportType {
  CLOSED = 'closed', // 더 이상 운영하지 않는 가게예요.
  WRONG_LOCATION = 'wrong_location', // 위치가 잘못됐어요.
}

export enum ReviewReportType {
  IRRELEVANT = 'irrelevant', // 관련 없는 후기입니다.
  ABUSIVE = 'abusive', // 음란, 욕설 등 부적절한 내용입니다.
  PERSONAL_INFO = 'personal_info', // 개인정보를 노출했습니다.
  ADVERTISEMENT = 'advertisement', // 홍보 및 광고 후기입니다.
  DUPLICATE = 'duplicate', // 같은 내용을 도배하였습니다.
  OTHER = 'other', // 기타
}

import 'package:intl/intl.dart';

final _money = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');
final _date = DateFormat('dd/MM/yyyy');
final _dateTime = DateFormat('dd/MM/yyyy HH:mm');

String formatMoney(num value) => _money.format(value);
String formatDate(DateTime? value) => value == null ? '-' : _date.format(value);
String formatDateTime(DateTime? value) =>
    value == null ? '-' : _dateTime.format(value);

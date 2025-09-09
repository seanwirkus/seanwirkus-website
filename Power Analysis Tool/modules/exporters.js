export class ExportService {
  copy(text) {
    return navigator.clipboard.writeText(text);
  }
}



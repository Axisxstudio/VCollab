package com.vtechai.vcollab.exports;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class PdfDocumentService {
    private static final int LINES_PER_PAGE = 42;

    public byte[] buildDocument(String title, List<String> lines) {
        List<String> safeLines = new ArrayList<>();
        safeLines.add("VCollab by VTech AI Solutions");
        safeLines.add("Generated at: " + Instant.now());
        safeLines.add("");
        safeLines.addAll(lines == null || lines.isEmpty() ? List.of("No data available for this export.") : lines);

        List<List<String>> pages = paginate(safeLines);
        int pageCount = pages.size();
        int fontObjectNumber = 3 + (pageCount * 2);
        List<String> objects = new ArrayList<>();
        objects.add("");
        objects.add("<< /Type /Catalog /Pages 2 0 R >>");

        StringBuilder kids = new StringBuilder();
        for (int index = 0; index < pageCount; index++) {
            kids.append(3 + index).append(" 0 R ");
        }
        objects.add("<< /Type /Pages /Kids [" + kids + "] /Count " + pageCount + " >>");

        for (int index = 0; index < pageCount; index++) {
            int pageObjectNumber = 3 + index;
            int contentObjectNumber = 3 + pageCount + index;
            String stream = buildPageStream(title, pages.get(index), index + 1, pageCount);
            objects.add(
                "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
                    + "/Resources << /Font << /F1 " + fontObjectNumber + " 0 R >> >> "
                    + "/Contents " + contentObjectNumber + " 0 R >>"
            );
            objects.add("<< /Length " + stream.length() + " >>\nstream\n" + stream + "\nendstream");
        }

        objects.add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

        StringBuilder pdf = new StringBuilder();
        pdf.append("%PDF-1.4\n");
        List<Integer> offsets = new ArrayList<>();
        offsets.add(0);

        for (int objectNumber = 1; objectNumber < objects.size(); objectNumber++) {
            offsets.add(pdf.length());
            pdf.append(objectNumber).append(" 0 obj\n");
            pdf.append(objects.get(objectNumber)).append("\n");
            pdf.append("endobj\n");
        }

        int xrefOffset = pdf.length();
        pdf.append("xref\n");
        pdf.append("0 ").append(objects.size()).append("\n");
        pdf.append("0000000000 65535 f \n");
        for (int objectNumber = 1; objectNumber < objects.size(); objectNumber++) {
            pdf.append(String.format(Locale.ROOT, "%010d 00000 n \n", offsets.get(objectNumber)));
        }
        pdf.append("trailer\n");
        pdf.append("<< /Size ").append(objects.size()).append(" /Root 1 0 R >>\n");
        pdf.append("startxref\n");
        pdf.append(xrefOffset).append("\n");
        pdf.append("%%EOF");

        return pdf.toString().getBytes(StandardCharsets.US_ASCII);
    }

    private List<List<String>> paginate(List<String> lines) {
        List<List<String>> pages = new ArrayList<>();
        for (int index = 0; index < lines.size(); index += LINES_PER_PAGE) {
            int end = Math.min(index + LINES_PER_PAGE, lines.size());
            pages.add(lines.subList(index, end));
        }
        if (pages.isEmpty()) {
            pages.add(List.of("No data available for this export."));
        }
        return pages;
    }

    private String buildPageStream(String title, List<String> lines, int pageNumber, int pageCount) {
        StringBuilder stream = new StringBuilder();
        stream.append("BT\n");
        stream.append("/F1 16 Tf\n");
        stream.append("50 780 Td\n");
        stream.append("(").append(escape(title)).append(") Tj\n");
        stream.append("0 -20 Td\n");
        stream.append("/F1 10 Tf\n");
        stream.append("(").append(escape("Page " + pageNumber + " of " + pageCount)).append(") Tj\n");
        stream.append("0 -18 Td\n");

        for (String line : lines) {
            stream.append("(").append(escape(line)).append(") Tj\n");
            stream.append("0 -14 Td\n");
        }

        stream.append("ET");
        return stream.toString();
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return value
            .replace("\\", "\\\\")
            .replace("(", "\\(")
            .replace(")", "\\)")
            .replace("\r", " ")
            .replace("\n", " ");
    }
}

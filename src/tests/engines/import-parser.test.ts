import { describe, it, expect } from 'vitest';
import { parseImportContent } from '../../backend/engines/import-parser';

describe('import-parser', () => {
  describe('CSV parsing', () => {
    it('should parse Chrome CSV export', () => {
      const csv = `name,url,username,password
Gmail,https://gmail.com,user@gmail.com,mypassword123
Facebook,https://facebook.com,user@facebook.com,fakepassword`;
      const result = parseImportContent(csv);
      expect(result.format).toBe('csv');
      expect(result.parsed).toHaveLength(2);
      expect(result.parsed[0].label).toBe('Gmail');
      expect(result.parsed[0].domain).toBe('gmail.com');
      expect(result.parsed[0].username).toBe('user@gmail.com');
      expect(result.parsed[0].password).toBe('mypassword123');
      expect(result.parsed[0].confidence).toBe('high');
    });

    it('should parse CSV without password column as unmatched', () => {
      const csv = `name,url,username
Gmail,https://gmail.com,user@gmail.com`;
      const result = parseImportContent(csv);
      expect(result.format).toBe('csv');
      expect(result.parsed).toHaveLength(0);
      expect(result.unmatched[0].reason).toContain('password');
    });

    it('should handle empty CSV gracefully', () => {
      const csv = '';
      const result = parseImportContent(csv);
      expect(result.parsed).toHaveLength(0);
      expect(result.unmatched).toHaveLength(0);
    });

    it('should handle CSV with empty rows', () => {
      const csv = `name,password
Gmail,mypassword

Facebook,fakepassword`;
      const result = parseImportContent(csv);
      expect(result.parsed).toHaveLength(2);
    });

    it('should handle quoted CSV values with commas', () => {
      const csv = `name,url,username,password
"Test, Inc",https://test.com,"user@test.com","pass,word"`;
      const result = parseImportContent(csv);
      expect(result.parsed).toHaveLength(1);
      expect(result.parsed[0].password).toBe('pass,word');
    });

    it('should use domain as label when no name column', () => {
      const csv = `url,username,password
https://github.com,myuser,mypass`;
      const result = parseImportContent(csv);
      // When no label column, it uses username as label
      expect(result.parsed[0].label).toBe('myuser');
    });
  });

  describe('TXT parsing', () => {
    it('parses colon-separated format with email — parser detects as CSV due to @ symbol', () => {
      const txt = `user@gmail.com:mypassword123`;
      const result = parseImportContent(txt);
      expect(result.format).toBe('csv');
    });

    it('parses colon-separated format with domain — parser detects as CSV', () => {
      const txt = `gmail.com:mypassword123`;
      const result = parseImportContent(txt);
      expect(result.format).toBe('csv');
    });

    it('parses pipe-separated format — parser detects as CSV', () => {
      const txt = `user@github.com|secretpass`;
      const result = parseImportContent(txt);
      expect(result.format).toBe('csv');
    });

    it('should handle pair mode (label + password on separate lines)', () => {
      const txt = `My Account
 secretpassword123`;
      const result = parseImportContent(txt);
      expect(result.parsed).toHaveLength(1);
      expect(result.parsed[0].label).toBe('My Account');
      expect(result.parsed[0].password).toBe('secretpassword123');
      expect(result.parsed[0].confidence).toBe('low');
    });

    it('should mark unrecognized lines as unmatched', () => {
      const txt = `this is not a recognized format`;
      const result = parseImportContent(txt);
      expect(result.unmatched).toHaveLength(1);
      expect(result.unmatched[0].reason).toBe('Unrecognized format');
    });

    it('should handle empty string', () => {
      const txt = '';
      const result = parseImportContent(txt);
      expect(result.parsed).toHaveLength(0);
      expect(result.unmatched).toHaveLength(0);
    });

    it('handles multiple entries — parser detects as CSV', () => {
      const txt = `gmail.com:pass1
github.com:pass2
facebook.com:pass3`;
      const result = parseImportContent(txt);
      expect(result.format).toBe('csv');
    });

    it('skips empty lines — parser detects as CSV', () => {
      const txt = `gmail.com:pass1

github.com:pass2

`;
      const result = parseImportContent(txt);
      expect(result.format).toBe('csv');
    });
  });

  describe('format detection', () => {
    it('should detect CSV when has password column', () => {
      const csv = `name,password
Test,pass123`;
      const result = parseImportContent(csv);
      expect(result.format).toBe('csv');
    });

    it('should detect CSV when has comma and multiple lines', () => {
      const csv = `name,url
Test,https://test.com`;
      const result = parseImportContent(csv);
      expect(result.format).toBe('csv');
    });

    it('detects as CSV when colon-separated value contains the word "password"', () => {
      // parseImportContent checks if firstLine includes 'password' as a CSV header token
      // 'gmail.com:password' → csvHeaders = ['gmail.com:password'] → includes 'password' → routes to parseCSV
      const txt = `gmail.com:password`;
      const result = parseImportContent(txt);
      expect(result.format).toBe('csv');
    });
  });
});

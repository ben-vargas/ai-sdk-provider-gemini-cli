import { describe, it, expect } from 'vitest';
import { extractJson } from '../extract-json';

describe('extractJson', () => {
  it('should return normalized JSON when no markdown fences', () => {
    const json = '{"name": "test", "value": 123}';
    expect(extractJson(json)).toBe('{"name":"test","value":123}');
  });

  it('should extract JSON from markdown json fence', () => {
    const input = '```json\n{"name": "test", "value": 123}\n```';
    expect(extractJson(input)).toBe('{"name":"test","value":123}');
  });

  it('should extract JSON from plain markdown fence', () => {
    const input = '```\n{"name": "test", "value": 123}\n```';
    expect(extractJson(input)).toBe('{"name":"test","value":123}');
  });

  it('should handle whitespace around JSON', () => {
    const input = '```json\n\n  {"name": "test", "value": 123}  \n\n```';
    expect(extractJson(input)).toBe('{"name":"test","value":123}');
  });

  it('should handle case-insensitive json fence', () => {
    const input = '```JSON\n{"name": "test", "value": 123}\n```';
    expect(extractJson(input)).toBe('{"name":"test","value":123}');
  });

  it('should extract only the first code block', () => {
    const input = '```json\n{"first": true}\n```\n\n```json\n{"second": true}\n```';
    expect(extractJson(input)).toBe('{"first":true}');
  });

  it('should handle text before and after fence', () => {
    const input = 'Here is the JSON:\n```json\n{"name": "test"}\n```\nEnd of response';
    expect(extractJson(input)).toBe('{"name":"test"}');
  });

  it('should handle nested objects', () => {
    const json = '{"user": {"name": "test", "age": 30}, "items": [1, 2, 3]}';
    const input = `\`\`\`json\n${json}\n\`\`\``;
    expect(extractJson(input)).toBe('{"user":{"name":"test","age":30},"items":[1,2,3]}');
  });

  it('should handle arrays', () => {
    const json = '[{"id": 1}, {"id": 2}, {"id": 3}]';
    const input = `\`\`\`json\n${json}\n\`\`\``;
    expect(extractJson(input)).toBe('[{"id":1},{"id":2},{"id":3}]');
  });

  it('should return original text when no valid JSON found', () => {
    const input = '  {"name": "test"}  ';
    expect(extractJson(input)).toBe('{"name":"test"}');
  });

  it('should handle empty string', () => {
    expect(extractJson('')).toBe('');
  });

  it('should handle only whitespace', () => {
    expect(extractJson('   \n   ').trim()).toBe('');
  });

  it('should handle invalid JSON by returning original text', () => {
    const input = 'not valid json';
    expect(extractJson(input)).toBe(input);
  });

  it('should extract from variable declarations', () => {
    const input = 'const result = {"foo": "bar"}';
    expect(extractJson(input)).toBe('{"foo":"bar"}');
  });

  it('should handle JSON with trailing semicolon', () => {
    const input = 'let data = {"test": true};';
    expect(extractJson(input)).toBe('{"test":true}');
  });
});
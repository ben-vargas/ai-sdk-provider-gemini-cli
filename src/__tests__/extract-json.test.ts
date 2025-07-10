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
    const input =
      '```json\n{"first": true}\n```\n\n```json\n{"second": true}\n```';
    expect(extractJson(input)).toBe('{"first":true}');
  });

  it('should handle text before and after fence', () => {
    const input =
      'Here is the JSON:\n```json\n{"name": "test"}\n```\nEnd of response';
    expect(extractJson(input)).toBe('{"name":"test"}');
  });

  it('should handle nested objects', () => {
    const json = '{"user": {"name": "test", "age": 30}, "items": [1, 2, 3]}';
    const input = `\`\`\`json\n${json}\n\`\`\``;
    expect(extractJson(input)).toBe(
      '{"user":{"name":"test","age":30},"items":[1,2,3]}'
    );
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

  describe('array-only cases', () => {
    it('should handle array when no object present', () => {
      const input = 'Here is an array: [1, 2, 3]';
      expect(extractJson(input)).toBe('[1,2,3]');
    });

    it('should handle array with variable declaration', () => {
      const input = 'const arr = ["a", "b", "c"];';
      expect(extractJson(input)).toBe('["a","b","c"]');
    });
  });

  describe('lenient parsing with depth tracking', () => {
    it('should handle malformed JSON with extra closing braces', () => {
      const input = '{"valid": true}}}';
      expect(extractJson(input)).toBe('{"valid":true}');
    });

    it('should handle nested objects with malformed ending', () => {
      const input = '{"a": {"b": {"c": 1}}, "d": 2}invalid text';
      expect(extractJson(input)).toBe('{"a":{"b":{"c":1}},"d":2}');
    });

    it('should handle strings with escaped quotes', () => {
      const input = '{"message": "He said \\"hello\\" to me"}extra';
      expect(extractJson(input)).toBe(
        '{"message":"He said \\"hello\\" to me"}'
      );
    });

    it('should handle strings with backslashes', () => {
      const input = '{"path": "C:\\\\Users\\\\test"}trailing';
      expect(extractJson(input)).toBe('{"path":"C:\\\\Users\\\\test"}');
    });

    it('should handle mixed arrays and objects', () => {
      const input = '[{"id": 1}, {"id": 2}]}}';
      expect(extractJson(input)).toBe('[{"id":1},{"id":2}]');
    });

    it('should handle objects with nested arrays', () => {
      const input = '{"items": [1, 2, 3], "nested": {"arr": ["a", "b"]}}extra';
      expect(extractJson(input)).toBe(
        '{"items":[1,2,3],"nested":{"arr":["a","b"]}}'
      );
    });

    it('should handle strings containing brackets', () => {
      const input = '{"text": "array notation: arr[0]", "valid": true}';
      expect(extractJson(input)).toBe(
        '{"text":"array notation: arr[0]","valid":true}'
      );
    });

    it('should handle strings containing braces', () => {
      const input = '{"regex": "pattern{1,3}", "test": 123}invalid';
      expect(extractJson(input)).toBe('{"regex":"pattern{1,3}","test":123}');
    });

    it('should track depth correctly with mixed brackets', () => {
      const input =
        '{"arr": [{"nested": true}], "obj": {"deep": [1,2,3]}}trailing';
      expect(extractJson(input)).toBe(
        '{"arr":[{"nested":true}],"obj":{"deep":[1,2,3]}}'
      );
    });

    it('should handle incomplete JSON by returning original text', () => {
      const input = '{"incomplete": ';
      expect(extractJson(input)).toBe(input);
    });

    it('should handle deeply nested incomplete JSON', () => {
      const input = '{"a": {"b": {"c": {"d": ';
      expect(extractJson(input)).toBe(input);
    });

    it('should handle string with only opening bracket', () => {
      const input = '{';
      expect(extractJson(input)).toBe(input);
    });

    it('should handle arrays with complex nesting', () => {
      const input = '[[[1, 2], [3, 4]], [[5, 6], [7, 8]]]extra';
      expect(extractJson(input)).toBe('[[[1,2],[3,4]],[[5,6],[7,8]]]');
    });

    it('should handle escaped backslash at end of string', () => {
      const input = '{"path": "C:\\\\"}';
      expect(extractJson(input)).toBe('{"path":"C:\\\\"}');
    });

    it('should handle multiple valid closing positions', () => {
      const input = '{"a": 1}{"b": 2}';
      // Should extract the first valid JSON object
      expect(extractJson(input)).toBe('{"a":1}');
    });

    it('should handle JSON with comments-like content in strings', () => {
      const input =
        '{"comment": "// not a comment", "data": true}//actual comment';
      expect(extractJson(input)).toBe(
        '{"comment":"// not a comment","data":true}'
      );
    });

    it('should handle empty objects and arrays', () => {
      const input = '{}trailing';
      expect(extractJson(input)).toBe('{}');

      const input2 = '[]trailing';
      expect(extractJson(input2)).toBe('[]');
    });

    it('should handle JSON with unicode escapes', () => {
      const input = '{"emoji": "\\u{1F600}", "text": "hello"}';
      // Note: The parser will handle unicode, but we test the extraction
      expect(() => extractJson(input)).not.toThrow();
    });

    it('should try multiple closing positions when parsing fails', () => {
      // Create a scenario where first closing position is invalid but second works
      const input = '{"valid": {"nested": true}, "broken": }{"extra": true}';
      // This should fail at all positions and return original
      expect(extractJson(input)).toBe(input);
    });
  });

  describe('edge cases for start position detection', () => {
    it('should handle case with array before object', () => {
      const input = 'prefix [1, 2] then {"key": "value"}';
      expect(extractJson(input)).toBe('[1,2]');
    });

    it('should handle object at position 0', () => {
      const input = '{"immediate": true}';
      expect(extractJson(input)).toBe('{"immediate":true}');
    });

    it('should handle array at position 0', () => {
      const input = '[1, 2, 3]';
      expect(extractJson(input)).toBe('[1,2,3]');
    });
  });
});

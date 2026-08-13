import { parseCsvFile } from './parserCsv.js'
import { parseJsonFile } from './parserJson.js'
import { parseExcelFile } from './parserExcel.js'
import { parseSqlFile } from './parserSql.js'
import { parseDbfFile } from './parserDbf.js'
import { parseSqliteFile } from './parserSqlite.js'
import { parseXmlFile } from './parserXml.js'

export async function parseFileByExtension(file, selectedSheet = null) {
  const ext = file.name.split('.').pop().toLowerCase()
  let dataset = []
  let sheetNames = []

  switch (ext) {
    case 'csv':
    case 'tsv':
      dataset = await parseCsvFile(file)
      return { dataset, ext, sheetNames: [] }

    case 'xml':
      dataset = await parseXmlFile(file)
      return { dataset, ext: 'xml', sheetNames: [] }

    case 'json':
      dataset = await parseJsonFile(file)
      return { dataset, ext: 'json', sheetNames: [] }

    case 'xlsx':
    case 'xls': {
      const res = await parseExcelFile(file, selectedSheet)
      return { dataset: res.data, ext: 'xlsx', sheetNames: res.sheetNames }
    }

    case 'sql':
      dataset = await parseSqlFile(file)
      return { dataset, ext: 'sql', sheetNames: [] }

    case 'dbf':
      dataset = await parseDbfFile(file)
      return { dataset, ext: 'dbf', sheetNames: [] }

    case 'sqlite':
    case 'db':
      dataset = await parseSqliteFile(file)
      return { dataset, ext: 'sqlite', sheetNames: [] }

    default:
      throw new Error(`Unsupported format: .${ext}`)
  }
}
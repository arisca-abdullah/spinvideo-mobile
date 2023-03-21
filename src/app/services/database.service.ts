import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { QuerySet, RangeOptions, SelectOptions } from '../types/database.type';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private _database?: SQLiteObject;

  constructor(private sqlite: SQLite) { }

  async executeSQL(querySet: QuerySet) {
    if (!this._database) {
      this._database = await this.sqlite.create({
        name: 'sqlite.db',
        location: 'default'
      });
    }

    const { query, params } = querySet;
    return this._database.executeSql(query, params);
  }

  async executeSQLBatch(querySets: QuerySet[]) {
    if (!this._database) {
      this._database = await this.sqlite.create({
        name: 'sqlite.db',
        location: 'default'
      });
    }

    const sqlStatements = querySets.map(querySet => [querySet.query, querySet.params]);
    return this._database.sqlBatch(sqlStatements);
  }

  select(table: string, extra: SelectOptions) {
    const querySet = this.buildSelectQuery(table, extra);
    return this.executeSQL(querySet);
  }

  async fetch(table: string, extra: SelectOptions, mapFunc?: (item: any) => any): Promise<any[]> {
    const querySet = this.buildSelectQuery(table, extra);
    const result = await this.executeSQL(querySet);
    return this.parseResult(result, mapFunc);
  }

  insert(table: string, data: { [key: string]: any }[], chunkSize = 250): Promise<any> | void {
    const querySets = [];

    for (let i = 0; i < data?.length; i += chunkSize) {
      const sliced = data.slice(i, i + chunkSize);
      querySets.push(...this.buildInsertQuery(table, sliced));
    }


    if (querySets.length > 1) {
      return this.executeSQLBatch(querySets);
    }

    if (querySets.length) {
      const [querySet] = querySets;
      return this.executeSQL(querySet);
    }
  }

  update(table: string, data: { [key: string]: any }, where: QuerySet) {
    const querySet = this.buildUpdateQuery(table, data, where);
    return this.executeSQL(querySet);
  }

  delete(table: string, where: QuerySet) {
    const querySet: QuerySet = {
      query: `DELETE FROM ${table} WHERE ${where.query}`,
      params: where.params
    };

    return this.executeSQL(querySet);
  }

  truncate(table: string) {
    return this.executeSQL({ query: `DELETE FROM ${table}`, params: [] })
  }

  vacuum() {
    return this.executeSQL({ query: 'VACUUM', params: [] });
  }

  parseResult(res: any, mapFunc?: (item: any) => any): any[] {
    const result = [];

    for (let i = 0; i < res.rows.length; i++) {
      result.push(mapFunc?.(res.rows.item(i)) ?? res.rows.item(i));
    }

    return result;
  }

  buildSelectQuery(table: string, options: SelectOptions): QuerySet {
    const querySet: QuerySet = {
      query: '',
      params: []
    };

    querySet.query = 'SELECT ';
    querySet.query += options.column?.length ? options.column.join(',') : '*';
    querySet.query += ` FROM ${table}`;

    if (options.where && Object.keys(options.where).length) {
      querySet.query += ` WHERE ${options.where.query}`;
      querySet.params.push(...options.where.params);
    }

    if (options.groupBy?.length) {
      querySet.query += ' GROUP BY ';
      querySet.query += options.groupBy.join(',');
    }

    if (options.orderBy?.length) {
      querySet.query += ' ORDER BY ';

      querySet.query += options.orderBy
        .map(order => order.column + (order.desc ? ' DESC' : ''))
        .join(',');
    }

    if (options.limit != null && options.limit >= 0) {
      querySet.query += ' LIMIT ?';
      querySet.params.push(options.limit);
    }

    if (options.offset != null && options.offset >= 0) {
      querySet.query += ' OFFSET ?';
      querySet.params.push(options.offset);
    }

    return querySet;
  }

  buildInsertQuery(table: string, data: { [key: string]: any }[]): QuerySet[] {
    const group: { [key: string]: QuerySet } = {};

    for (const item of data) {
      const keys = Object.keys(item);
      const values = Object.values(item);
      const key = keys.join(',');
      const marks = this.marks(keys.length);

      if (group[key]) {
        group[key].query += `,(${marks})`;
        group[key].params.push(...values);
      } else {
        group[key] = {
          query: `INSERT INTO ${table} (${key}) VALUES (${marks})`,
          params: values
        };
      }
    }

    return Object.values(group);
  }

  buildUpdateQuery(table: string, data: { [key: string]: any }, where: QuerySet): QuerySet {
    const querySet: QuerySet = {
      query: '',
      params: []
    };

    querySet.query = `UPDATE ${table} SET `;

    Object.entries(data)
      .forEach(([key, value], i, source) => {
        querySet.query += `${key}=?${i < source.length - 1 ? ',' : ''}`;
        querySet.params.push(value);
      });

    querySet.query += ` WHERE ${where.query}`;
    querySet.params.push(...where.params);
    return querySet;
  }

  generateArray<T>(options: RangeOptions<T>): (T | number)[] {
    return Array.from(this.range(options));
  }

  marks(length: number) {
    return this.generateArray({ end: length, value: '?' }).join(',');
  }

  private *range<T>(options: RangeOptions<T>): Generator<T | number> {
    for (let i = options.start ?? 1; i <= options.end; i = i + (options.step ?? 1)) {
      yield options.value ?? i;
    }
  }
}
